import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser, User } from "@db/schema";
import { getDb } from "./connection";

export async function findUserByUnionId(
  unionId: string,
): Promise<User | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(
  email: string,
): Promise<User | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser): Promise<User> {
  const email = data.email?.trim().toLowerCase();
  if (!email) {
    throw new Error(
      "A verified email address is required to create an account.",
    );
  }

  const values: InsertUser = {
    ...data,
    email,
    unionId: email,
    role: "user",
    lastSignInAt: new Date(),
  };
  const existing = await findUserByEmail(email);
  if (existing) {
    values.unionId = existing.unionId;
    values.role = existing.role;
    await getDb()
      .update(schema.users)
      .set(values)
      .where(eq(schema.users.id, existing.id));
    return { ...existing, ...values };
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        avatar: values.avatar,
        lastSignInAt: values.lastSignInAt,
      },
    });
  const user = await findUserByUnionId(email);
  if (!user) {
    throw new Error("Account creation did not return the saved user.");
  }
  return user;
}
