import { requireUserId, jsonError } from "@/server/api";
import { deleteShare } from "@/server/repositories/shares";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await deleteShare(id, userId);
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to delete share", 500);
  }
}
