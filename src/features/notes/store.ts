import { create } from "zustand";
import type { Note, CreateNoteInput } from "./types";
import { noteRepository } from "./repository";
import { logger } from "@/lib/logger";

interface NoteState {
    notes: Note[];
    loading: boolean;
    searchQuery: string;
    selectedTag: string | null;
    loadNotes: () => Promise<void>;
    addNote: (input: CreateNoteInput) => Promise<void>;
    updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setSelectedTag: (tag: string | null) => void;
    searchNotes: (query: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
    notes: [],
    loading: false,
    searchQuery: "",
    selectedTag: null,

    loadNotes: async () => {
        set({ loading: true });
        try {
            const notes = await noteRepository.getAll();
            set({ notes, loading: false });
        } catch (err) {
            logger.error("Failed to load notes", err);
            set({ loading: false });
        }
    },

    addNote: async (input) => {
        try {
            await noteRepository.create(input);
            await get().loadNotes();
        } catch (err) {
            logger.error("Failed to add note", err);
        }
    },

    updateNote: async (id, changes) => {
        try {
            await noteRepository.update(id, changes);
            await get().loadNotes();
        } catch (err) {
            logger.error("Failed to update note", err);
        }
    },

    deleteNote: async (id) => {
        try {
            await noteRepository.remove(id);
            await get().loadNotes();
        } catch (err) {
            logger.error("Failed to delete note", err);
        }
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedTag: (selectedTag) => set({ selectedTag }),

    searchNotes: async (query) => {
        set({ loading: true });
        try {
            const notes = await noteRepository.search(query);
            set({ notes, loading: false });
        } catch (err) {
            logger.error("Failed to search notes", err);
            set({ loading: false });
        }
    },
}));
