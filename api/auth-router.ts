import * as cookie from "cookie";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { adminLoginAttempts } from "@db/schema";
import { getDb } from "./queries/connection";
import { getSessionCookieOptions } from "./lib/cookies";
import { createAdminSessionCookie, createEmailSessionCookie } from "./auth";
import { requestEmailOtp, verifyEmailOtp } from "./email-otp";
import { findUserByEmail } from "./queries/users";
import { verifyPassword } from "./password";
import {
  createRouter,
  adminQuery,
  authedQuery,
  publicQuery,
} from "./middleware";

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  adminSession: adminQuery.query(() => true),
  adminSessionStatus: publicQuery.query(
    ({ ctx }) =>
      ctx.user?.role === "admin" && ctx.authMethod === "admin_password",
  ),
  adminLogin: publicQuery
    .input(
      z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const now = new Date();
      const attemptRows = await getDb()
        .select()
        .from(adminLoginAttempts)
        .where(eq(adminLoginAttempts.email, email))
        .limit(1);
      const attempts = attemptRows.at(0);
      if (attempts?.lockedUntil && attempts.lockedUntil > now) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many sign-in attempts. Please try again in 15 minutes.",
        });
      }

      const user = await findUserByEmail(email);
      const valid =
        !!user &&
        user.role === "admin" &&
        (await verifyPassword(input.password, user.passwordHash));
      if (!valid || !user) {
        const withinWindow =
          attempts &&
          now.getTime() - attempts.windowStartedAt.getTime() <
            ADMIN_LOGIN_WINDOW_MS;
        const nextAttempts = withinWindow ? attempts.attempts + 1 : 1;
        const windowStartedAt = withinWindow ? attempts.windowStartedAt : now;
        await getDb()
          .insert(adminLoginAttempts)
          .values({
            email,
            attempts: nextAttempts,
            windowStartedAt,
            lockedUntil:
              nextAttempts >= ADMIN_LOGIN_MAX_ATTEMPTS
                ? new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS)
                : null,
          })
          .onDuplicateKeyUpdate({
            set: {
              attempts: sql`IF(${adminLoginAttempts.windowStartedAt} < ${new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS)}, 1, ${adminLoginAttempts.attempts} + 1)`,
              windowStartedAt: sql`IF(${adminLoginAttempts.windowStartedAt} < ${new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS)}, ${now}, ${adminLoginAttempts.windowStartedAt})`,
              lockedUntil: sql`IF(${adminLoginAttempts.windowStartedAt} < ${new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS)}, NULL, IF(${adminLoginAttempts.attempts} + 1 >= ${ADMIN_LOGIN_MAX_ATTEMPTS}, ${new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS)}, ${adminLoginAttempts.lockedUntil}))`,
            },
          });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The email or password is incorrect.",
        });
      }

      await getDb()
        .delete(adminLoginAttempts)
        .where(eq(adminLoginAttempts.email, email));
      const token = await createAdminSessionCookie(user.unionId);
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: true,
          path: opts.path,
          sameSite: "lax",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );
      return { success: true };
    }),
  requestEmailOtp: publicQuery
    .input(z.object({ email: z.string().trim().email().max(320) }))
    .mutation(async ({ input }) => {
      await requestEmailOtp(input.email);
      return { success: true };
    }),
  verifyEmailOtp: publicQuery
    .input(
      z.object({
        email: z.string().trim().email().max(320),
        code: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await verifyEmailOtp(input.email, input.code);
      const token = await createEmailSessionCookie(user.unionId);
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: true,
          path: opts.path,
          sameSite: "lax",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );
      return { success: true };
    }),
  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
        expires: new Date(0),
      }),
    );
    return { success: true };
  }),
});
