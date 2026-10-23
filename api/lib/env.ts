import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID ?? "";
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET ?? "";
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get smtpUser() {
    return process.env.SMTP_USER ?? "";
  },
  get smtpPass() {
    return process.env.SMTP_PASS ?? "";
  },
};
