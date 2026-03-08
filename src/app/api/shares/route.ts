import { z } from "zod";
import { requireUserId, jsonError } from "@/server/api";
import {
  createShare,
  getSharesForUser,
  getSharesByOwner,
  resolveUserByEmail,
} from "@/server/repositories/shares";

const createShareSchema = z.object({
  itemType: z.enum(["task", "note", "trip"]),
  itemId: z.string().min(1),
  email: z.string().email(),
  permission: z.enum(["view", "edit"]),
});

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "by-me") {
      const shares = await getSharesByOwner(userId);
      return Response.json(shares);
    }

    const shares = await getSharesForUser(userId);
    return Response.json(shares);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to fetch shares", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createShareSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid input", 400, parsed.error.flatten());
    }

    const { itemType, itemId, email, permission } = parsed.data;

    const targetUserId = await resolveUserByEmail(email);
    if (!targetUserId) {
      return jsonError("User not found. They must have an account to receive shared items.", 404);
    }

    if (targetUserId === userId) {
      return jsonError("Cannot share with yourself", 400);
    }

    const share = await createShare({
      itemType,
      itemId,
      ownerId: userId,
      sharedWith: targetUserId,
      permission,
    });

    return Response.json(share, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return jsonError("Already shared with this user", 409);
    }
    return jsonError("Failed to create share", 500);
  }
}
