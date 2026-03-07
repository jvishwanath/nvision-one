import { and, count, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import type { CreateNoteInput, Note } from "@/features/notes/types";

async function getTagsByNoteId(noteId: string): Promise<string[]> {
  const { notesTags } = getSchema();
  const rows = await db.select({ tag: notesTags.tag }).from(notesTags).where(eq(notesTags.noteId, noteId));
  return rows.map((row: { tag: string }) => row.tag);
}

async function withTags(items: Array<Omit<Note, "tags" | "pinned">>): Promise<Note[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      pinned: false,
      tags: await getTagsByNoteId(item.id),
    }))
  );
}

export async function listNotes(userId: string): Promise<Note[]> {
  const { notes } = getSchema();
  const rows = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  return withTags(rows);
}

export async function getNoteById(userId: string, id: string): Promise<Note | null> {
  const { notes } = getSchema();
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.id, id)))
    .limit(1);
  if (!note) return null;
  return { ...note, tags: await getTagsByNoteId(note.id) };
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<Note> {
  const { notes, notesTags } = getSchema();
  const now = new Date().toISOString();
  const created = {
    id: crypto.randomUUID(),
    userId,
    title: input.title,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(notes).values(created);
  if (input.tags.length > 0) {
    await db.insert(notesTags).values(input.tags.map((tag) => ({ noteId: created.id, tag })));
  }

  return { ...created, pinned: input.pinned ?? false, tags: input.tags };
}

export async function updateNote(userId: string, id: string, changes: Partial<Note>): Promise<Note | null> {
  const { notes, notesTags } = getSchema();
  const next = {
    title: changes.title,
    content: changes.content,
    updatedAt: new Date().toISOString(),
  };

  await db.update(notes).set(next).where(and(eq(notes.userId, userId), eq(notes.id, id)));

  if (changes.tags) {
    await db.delete(notesTags).where(eq(notesTags.noteId, id));
    if (changes.tags.length > 0) {
      await db.insert(notesTags).values(changes.tags.map((tag) => ({ noteId: id, tag })));
    }
  }

  return getNoteById(userId, id);
}

export async function deleteNote(userId: string, id: string) {
  const { notes } = getSchema();
  await db.delete(notes).where(and(eq(notes.userId, userId), eq(notes.id, id)));
}

export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  const { notes } = getSchema();
  const q = `%${query.trim()}%`;
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), or(like(notes.title, q), like(notes.content, q))))
    .orderBy(desc(notes.createdAt));

  return withTags(rows);
}

export async function countNotes(userId: string): Promise<number> {
  const { notes } = getSchema();
  const [row] = await db.select({ value: count() }).from(notes).where(eq(notes.userId, userId));
  return row?.value ?? 0;
}
