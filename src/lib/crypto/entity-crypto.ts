import { encrypt, decrypt, isEncryptedBlob } from "./encrypt";
import type { EncryptedBlob } from "./encrypt";
import { useKeyStore } from "@/features/auth/key-store";

function getMasterKey(): CryptoKey | null {
  return useKeyStore.getState().masterKey;
}

async function encryptField(value: string, key: CryptoKey): Promise<string> {
  const blob = await encrypt(value, key);
  return JSON.stringify(blob);
}

async function decryptField(value: string, key: CryptoKey): Promise<string> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isEncryptedBlob(parsed)) {
      return decrypt(parsed, key);
    }
  } catch {
    // Not encrypted or invalid JSON — return as-is
  }
  return value;
}

export interface EncryptableNote {
  title: string;
  content: string;
}

export interface EncryptableTask {
  title: string;
  description: string;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
}

export interface EncryptableTrip {
  name: string;
  destination: string;
}

export interface EncryptableItineraryItem {
  activity: string;
  notes: string;
}

export async function encryptNoteFields<T extends EncryptableNote>(note: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return note;
  return {
    ...note,
    title: await encryptField(note.title, key),
    content: await encryptField(note.content, key),
  };
}

export async function decryptNoteFields<T extends EncryptableNote>(note: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return note;
  return {
    ...note,
    title: await decryptField(note.title, key),
    content: await decryptField(note.content, key),
  };
}

export async function encryptTaskFields<T extends EncryptableTask>(task: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return task;
  return {
    ...task,
    title: await encryptField(task.title, key),
    description: await encryptField(task.description, key),
    subtasks: task.subtasks
      ? JSON.parse(await encryptField(JSON.stringify(task.subtasks), key)) === task.subtasks
        ? task.subtasks
        : undefined
      : undefined,
  };
}

export async function decryptTaskFields<T extends EncryptableTask>(task: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return task;
  return {
    ...task,
    title: await decryptField(task.title, key),
    description: await decryptField(task.description, key),
  };
}

export async function encryptTripFields<T extends EncryptableTrip>(trip: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return trip;
  return {
    ...trip,
    name: await encryptField(trip.name, key),
    destination: await encryptField(trip.destination, key),
  };
}

export async function decryptTripFields<T extends EncryptableTrip>(trip: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return trip;
  return {
    ...trip,
    name: await decryptField(trip.name, key),
    destination: await decryptField(trip.destination, key),
  };
}

export async function encryptItineraryFields<T extends EncryptableItineraryItem>(item: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return item;
  return {
    ...item,
    activity: await encryptField(item.activity, key),
    notes: await encryptField(item.notes, key),
  };
}

export async function decryptItineraryFields<T extends EncryptableItineraryItem>(item: T): Promise<T> {
  const key = getMasterKey();
  if (!key) return item;
  return {
    ...item,
    activity: await decryptField(item.activity, key),
    notes: await decryptField(item.notes, key),
  };
}

export async function decryptArray<T>(items: T[], decryptor: (item: T) => Promise<T>): Promise<T[]> {
  return Promise.all(items.map(decryptor));
}
