import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./router";

const adminUser = {
  id: 1,
  unionId: "admin@example.com",
  name: "Admin",
  email: "admin@example.com",
  avatar: null,
  passwordHash: null,
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

describe("admin session authorization", () => {
  it("requires the password-based admin session even for admin-role users", async () => {
    const caller = appRouter.createCaller({
      req: new Request("http://localhost/api/trpc"),
      resHeaders: new Headers(),
      user: adminUser,
      authMethod: "google",
    });

    await expect(caller.auth.adminSession()).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
  });

  it("accepts a password-based admin session", async () => {
    const caller = appRouter.createCaller({
      req: new Request("http://localhost/api/trpc"),
      resHeaders: new Headers(),
      user: adminUser,
      authMethod: "admin_password",
    });

    await expect(caller.auth.adminSession()).resolves.toBe(true);
  });
});
