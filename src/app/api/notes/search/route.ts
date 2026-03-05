import { jsonError, requireUserId } from "@/server/api";
import { searchNotes } from "@/server/repositories/notes";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    if (!query) return Response.json([]);
    const notes = await searchNotes(userId, query);
    return Response.json(notes);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to search notes", 500, error);
  }
}
