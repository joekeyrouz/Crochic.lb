import {
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const COST = 1 << 15;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function deriveKey(
  password: string,
  salt: Buffer,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, options, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string | null,
): Promise<boolean> {
  if (!encodedHash) {
    return false;
  }
  const [algorithm, cost, blockSize, parallelization, salt, key, ...extra] =
    encodedHash.split("$");
  const N = Number(cost);
  const r = Number(blockSize);
  const p = Number(parallelization);
  if (
    algorithm !== "scrypt" ||
    extra.length > 0 ||
    !Number.isSafeInteger(N) ||
    N !== COST ||
    r !== BLOCK_SIZE ||
    p !== PARALLELIZATION ||
    !salt ||
    !key
  ) {
    return false;
  }

  const expected = Buffer.from(key, "base64url");
  if (expected.length !== KEY_LENGTH) {
    return false;
  }
  const actual = await deriveKey(password, Buffer.from(salt, "base64url"), {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}
