import { z } from "zod";
import { NoteSchema } from "@/features/notes/schemas";
import { deleteNote, getNoteById, updateNote } from "@/server/repositories/notes";
import { jsonError, requireUserId } from "@/server/api";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const note = await getNoteById(userId, params.id);
    if (!note) return jsonError("Not found", 404);
    return Response.json(note);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load note", 500, error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const body = await request.json();
    const parsed = NoteSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const note = await updateNote(userId, params.id, parsed.data);
    if (!note) return jsonError("Not found", 404);
    return Response.json(note);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to update note", 500, error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    await deleteNote(userId, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to delete note", 500, error);
  }
}
