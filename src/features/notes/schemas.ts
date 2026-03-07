import { z } from "zod";

export const NoteSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    content: z.string(),
    tags: z.array(z.string()),
    pinned: z.boolean().default(false),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = NoteSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
