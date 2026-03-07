import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export async function getUserByEmail(email: string) {
  const { users } = getSchema();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function getUserById(id: string) {
  const { users } = getSchema();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  const created = {
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash: input.passwordHash,
    name: input.name,
    createdAt: new Date().toISOString(),
  };

  const { users } = getSchema();
  await db.insert(users).values(created);

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    createdAt: created.createdAt,
  } satisfies PublicUser;
}
