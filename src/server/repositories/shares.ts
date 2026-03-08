import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";

export type ShareRow = {
  id: string;
  itemType: string;
  itemId: string;
  ownerId: string;
  sharedWith: string;
  permission: string;
  sharedKey: string | null;
  createdAt: string;
};

export type ShareWithEmail = ShareRow & {
  ownerEmail: string;
  sharedWithEmail: string;
};

export async function createShare(input: {
  itemType: string;
  itemId: string;
  ownerId: string;
  sharedWith: string;
  permission: string;
  sharedKey?: string | null;
}): Promise<ShareRow> {
  const { shares } = getSchema();
  const row: ShareRow = {
    id: crypto.randomUUID(),
    itemType: input.itemType,
    itemId: input.itemId,
    ownerId: input.ownerId,
    sharedWith: input.sharedWith,
    permission: input.permission,
    sharedKey: input.sharedKey ?? null,
    createdAt: new Date().toISOString(),
  };
  await db.insert(shares).values(row);
  return row;
}

export async function deleteShare(id: string, ownerId: string): Promise<void> {
  const { shares } = getSchema();
  await db.delete(shares).where(and(eq(shares.id, id), eq(shares.ownerId, ownerId)));
}

export async function getSharesForUser(userId: string): Promise<ShareWithEmail[]> {
  const { shares, users } = getSchema();
  const rows = await db
    .select({
      id: shares.id,
      itemType: shares.itemType,
      itemId: shares.itemId,
      ownerId: shares.ownerId,
      sharedWith: shares.sharedWith,
      permission: shares.permission,
      sharedKey: shares.sharedKey,
      createdAt: shares.createdAt,
      ownerEmail: users.email,
    })
    .from(shares)
    .innerJoin(users, eq(shares.ownerId, users.id))
    .where(eq(shares.sharedWith, userId));

  return rows.map((r: typeof rows[number]) => ({
    ...r,
    sharedWithEmail: "",
  }));
}

export async function getSharesByOwner(ownerId: string): Promise<ShareWithEmail[]> {
  const { shares, users } = getSchema();
  const rows = await db
    .select({
      id: shares.id,
      itemType: shares.itemType,
      itemId: shares.itemId,
      ownerId: shares.ownerId,
      sharedWith: shares.sharedWith,
      permission: shares.permission,
      sharedKey: shares.sharedKey,
      createdAt: shares.createdAt,
      sharedWithEmail: users.email,
    })
    .from(shares)
    .innerJoin(users, eq(shares.sharedWith, users.id))
    .where(eq(shares.ownerId, ownerId));

  return rows.map((r: typeof rows[number]) => ({
    ...r,
    ownerEmail: "",
  }));
}

export async function getSharesForItem(
  itemType: string,
  itemId: string,
): Promise<ShareRow[]> {
  const { shares } = getSchema();
  return db
    .select()
    .from(shares)
    .where(and(eq(shares.itemType, itemType), eq(shares.itemId, itemId)));
}

export async function getSharedItemIds(
  userId: string,
  itemType: string,
): Promise<string[]> {
  const { shares } = getSchema();
  const rows = await db
    .select({ itemId: shares.itemId })
    .from(shares)
    .where(and(eq(shares.sharedWith, userId), eq(shares.itemType, itemType)));
  return rows.map((r: typeof rows[number]) => r.itemId);
}

export async function hasShareAccess(
  userId: string,
  itemType: string,
  itemId: string,
  requiredPermission?: "view" | "edit",
): Promise<boolean> {
  const { shares } = getSchema();
  const conditions = [
    eq(shares.sharedWith, userId),
    eq(shares.itemType, itemType),
    eq(shares.itemId, itemId),
  ];

  const rows = await db.select({ permission: shares.permission }).from(shares).where(and(...conditions)).limit(1);
  if (rows.length === 0) return false;
  if (!requiredPermission || requiredPermission === "view") return true;
  return rows[0]!.permission === "edit";
}

export async function resolveUserByEmail(email: string): Promise<string | null> {
  const { users } = getSchema();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
}
