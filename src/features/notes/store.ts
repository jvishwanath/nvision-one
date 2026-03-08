import { create } from "zustand";
import type { Note, CreateNoteInput } from "./types";
import { noteRepository } from "./repository";
import { logger } from "@/lib/logger";
import {
    encryptNoteFields,
    decryptNoteFields,
    decryptArray,
} from "@/lib/crypto/entity-crypto";
import { useKeyStore } from "@/features/auth/key-store";

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
        set({ loading: true, notes: [] }); // Clear notes immediately
        try {
            // Wait for master key to be ready
            const keyStore = useKeyStore.getState();
            if (!keyStore.ready) {
                await keyStore.initializeKey();
            }
            
            const raw = await noteRepository.getAll();
            const notes = await decryptArray(raw, decryptNoteFields);
            set({ notes, loading: false });
        } catch (err) {
            logger.error("Failed to load notes", err);
            set({ loading: false, notes: [] }); // Ensure notes are cleared on error
        }
    },

    addNote: async (input) => {
        try {
            const encrypted = await encryptNoteFields(input);
            await noteRepository.create(encrypted);
            await get().loadNotes();
        } catch (err) {
            logger.error("Failed to add note", err);
            throw err;
        }
    },

    updateNote: async (id, changes) => {
        try {
            const toEncrypt = { title: "", content: "", ...changes };
            const encrypted = await encryptNoteFields(toEncrypt);
            const finalChanges: Partial<Note> = { ...changes };
            if (changes.title !== undefined) finalChanges.title = encrypted.title;
            if (changes.content !== undefined) finalChanges.content = encrypted.content;
            await noteRepository.update(id, finalChanges);
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
            const raw = await noteRepository.search(query);
            const notes = await decryptArray(raw, decryptNoteFields);
            set({ notes, loading: false });
        } catch (err) {
            logger.error("Failed to search notes", err);
            set({ loading: false });
        }
    },
}));
