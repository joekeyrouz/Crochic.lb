import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import nodemailer, { type Transporter } from "nodemailer";
import { emailLoginCodes } from "@db/schema";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";
import { upsertUser } from "./queries/users";

const CODE_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string) {
  if (env.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }
  return createHmac("sha256", env.sessionSecret)
    .update(`${email}:${code}`)
    .digest("hex");
}

let cachedTransporter: Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const user = env.smtpUser;
  const pass = env.smtpPass;
  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
    return cachedTransporter;
  }
  console.warn(
    `[email] SMTP credentials missing. SMTP_USER: ${user ? "present" : "missing"}, SMTP_PASS: ${pass ? "present" : "missing"}`,
  );
  return null;
}

async function sendEmailCode(email: string, code: string) {
  const subject = "Your CroChic sign-in code";
  const text = `Your CroChic verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`;
  const html = `<p>Your CroChic verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`;

  if (!env.isProduction) {
    console.log(`\n========================================`);
    console.log(`  OTP CODE for ${email}: ${code}`);
    console.log(`========================================\n`);
  }

  // Send real email via Gmail SMTP
  const transporter = getTransporter();
  if (!transporter) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Email sign-in is not configured. Contact the site administrator.",
    });
  }

  try {
    await transporter.sendMail({
      from: `"CroChic" <${env.smtpUser}>`,
      to: email,
      subject,
      text,
      html,
    });
    console.log(`[email] Verification OTP sent to ${email} via SMTP`);
  } catch (error) {
    console.error("[email] SMTP send failed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to send verification email. Please try again shortly.",
    });
  }
}

export async function requestEmailOtp(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const now = new Date();
  await getDb()
    .delete(emailLoginCodes)
    .where(
      lt(
        emailLoginCodes.windowStartedAt,
        new Date(now.getTime() - RATE_WINDOW_MS),
      ),
    );
  const existingRows = await getDb()
    .select()
    .from(emailLoginCodes)
    .where(eq(emailLoginCodes.email, email))
    .limit(1);
  const existing = existingRows.at(0);

  if (
    existing &&
    now.getTime() - existing.sentAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait a minute before requesting another code.",
    });
  }

  const withinRateWindow =
    existing &&
    now.getTime() - existing.windowStartedAt.getTime() < RATE_WINDOW_MS;
  if (withinRateWindow && existing.sends >= MAX_SENDS_PER_WINDOW) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many codes requested. Please try again in an hour.",
    });
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const record = {
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    attempts: 0,
    sends: withinRateWindow ? existing.sends + 1 : 1,
    windowStartedAt: withinRateWindow ? existing.windowStartedAt : now,
    sentAt: now,
  };

  await getDb()
    .insert(emailLoginCodes)
    .values(record)
    .onDuplicateKeyUpdate({
      set: {
        codeHash: record.codeHash,
        expiresAt: record.expiresAt,
        attempts: 0,
        sends: record.sends,
        windowStartedAt: record.windowStartedAt,
        sentAt: record.sentAt,
      },
    });

  try {
    await sendEmailCode(email, code);
  } catch (error) {
    await getDb()
      .delete(emailLoginCodes)
      .where(eq(emailLoginCodes.email, email));
    throw error;
  }
}

export async function verifyEmailOtp(rawEmail: string, code: string) {
  const email = rawEmail.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(emailLoginCodes)
    .where(eq(emailLoginCodes.email, email))
    .limit(1);
  const record = rows.at(0);

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) {
      await getDb()
        .delete(emailLoginCodes)
        .where(eq(emailLoginCodes.email, email));
    }
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "That code has expired. Request a new one.",
    });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many incorrect codes. Request a new one.",
    });
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const received = Buffer.from(hashCode(email, code), "hex");
  if (!timingSafeEqual(expected, received)) {
    await getDb()
      .update(emailLoginCodes)
      .set({ attempts: sql`${emailLoginCodes.attempts} + 1` })
      .where(
        and(
          eq(emailLoginCodes.email, email),
          eq(emailLoginCodes.codeHash, record.codeHash),
          lt(emailLoginCodes.attempts, MAX_ATTEMPTS),
          gt(emailLoginCodes.expiresAt, new Date()),
        ),
      );
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "The code is incorrect. Please check it and try again.",
    });
  }

  const [consumeResult] = await getDb()
    .update(emailLoginCodes)
    .set({ attempts: MAX_ATTEMPTS })
    .where(
      and(
        eq(emailLoginCodes.email, email),
        eq(emailLoginCodes.codeHash, record.codeHash),
        lt(emailLoginCodes.attempts, MAX_ATTEMPTS),
        gt(emailLoginCodes.expiresAt, new Date()),
      ),
    );
  if (consumeResult.affectedRows !== 1) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "That code has expired or has already been used.",
    });
  }

  const user = await upsertUser({
    unionId: email,
    email,
    name: email.split("@")[0],
    avatar: null,
    role: "user",
    lastSignInAt: new Date(),
  });

  if (user.role === "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin accounts must sign in from the admin login page.",
    });
  }
  return user;
}
