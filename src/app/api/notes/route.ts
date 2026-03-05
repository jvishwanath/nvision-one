import { CreateNoteSchema } from "@/features/notes/schemas";
import { createNote, listNotes } from "@/server/repositories/notes";
import { jsonError, requireUserId } from "@/server/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const notes = await listNotes(userId);
    return Response.json(notes);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load notes", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = CreateNoteSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const note = await createNote(userId, parsed.data);
    return Response.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to create note", 500, error);
  }
}
