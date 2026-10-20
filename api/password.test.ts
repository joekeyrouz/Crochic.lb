import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("admin password hashing", () => {
  it("verifies only the password used to create the scrypt hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");

    await expect(
      verifyPassword("correct-horse-battery-staple", hash),
    ).resolves.toBe(true);
    await expect(verifyPassword("not-the-password", hash)).resolves.toBe(false);
    await expect(verifyPassword("anything", null)).resolves.toBe(false);
  });
});
