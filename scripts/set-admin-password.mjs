import "dotenv/config";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);

function ask(question) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this command in an interactive terminal.");
  }
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (buffer) => {
      for (const byte of buffer) {
        if (byte === 3) {
          process.stdout.write("\n");
          cleanup();
          reject(new Error("Password setup cancelled."));
          return;
        }
        if (byte === 13 || byte === 10) {
          process.stdout.write("\n");
          cleanup();
          resolve(value);
          return;
        }
        if (byte === 8 || byte === 127) {
          value = value.slice(0, -1);
        } else if (byte >= 32 && byte <= 126) {
          value += String.fromCharCode(byte);
        }
      }
    };
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.on("data", onData);
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    1 << 15,
    8,
    1,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

let connection;
try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
  const email = (await ask("Existing admin email: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  const password = await askHidden("New password (minimum 12 characters): ");
  if (password.length < 12 || password.length > 256) {
    throw new Error("Password must be between 12 and 256 characters.");
  }
  const confirmation = await askHidden("Confirm password: ");
  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute(
    "SELECT id, role FROM users WHERE LOWER(email) = ? LIMIT 1",
    [email],
  );
  const user = rows[0];
  if (!user || user.role !== "admin") {
    throw new Error("No existing admin account matches that email.");
  }

  const passwordHash = await hashPassword(password);
  await connection.execute("UPDATE users SET passwordHash = ? WHERE id = ?", [
    passwordHash,
    user.id,
  ]);
  console.log(`Password updated for existing admin account ${email}.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Password setup failed.",
  );
  process.exitCode = 1;
} finally {
  await connection?.end();
}
