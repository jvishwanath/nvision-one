import { ALGORITHM, IV_LENGTH, ENCRYPTION_VERSION } from "./constants";

export interface EncryptedBlob {
  ct: string;
  iv: string;
  v: number;
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    encoded.buffer as ArrayBuffer,
  );
  return {
    ct: toBase64(ciphertext),
    iv: toBase64(iv),
    v: ENCRYPTION_VERSION,
  };
}

export async function decrypt(
  blob: EncryptedBlob,
  key: CryptoKey,
): Promise<string> {
  const iv = fromBase64(blob.iv);
  const ciphertext = fromBase64(blob.ct);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(decrypted);
}

export async function encryptObject<T>(
  obj: T,
  key: CryptoKey,
): Promise<EncryptedBlob> {
  return encrypt(JSON.stringify(obj), key);
}

export async function decryptObject<T>(
  blob: EncryptedBlob,
  key: CryptoKey,
): Promise<T> {
  const json = await decrypt(blob, key);
  return JSON.parse(json) as T;
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.ct === "string" &&
    typeof obj.iv === "string" &&
    typeof obj.v === "number"
  );
}
