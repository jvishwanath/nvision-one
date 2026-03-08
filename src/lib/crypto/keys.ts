import {
  ALGORITHM,
  KEY_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
} from "./constants";

export interface WrappedKeyBundle {
  wrappedKey: string;
  salt: string;
  iv: string;
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

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

async function deriveWrappingKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password).buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

export async function wrapMasterKey(
  masterKey: CryptoKey,
  password: string,
): Promise<WrappedKeyBundle> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const wrappingKey = await deriveWrappingKey(password, salt);

  const wrapped = await crypto.subtle.wrapKey(
    "raw",
    masterKey,
    wrappingKey,
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
  );

  return {
    wrappedKey: toBase64(wrapped),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

export async function unwrapMasterKey(
  bundle: WrappedKeyBundle,
  password: string,
): Promise<CryptoKey> {
  const salt = fromBase64(bundle.salt);
  const iv = fromBase64(bundle.iv);
  const wrappedKeyData = fromBase64(bundle.wrappedKey);
  const wrappingKey = await deriveWrappingKey(password, salt);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyData.buffer as ArrayBuffer,
    wrappingKey,
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function rewrapMasterKey(
  masterKey: CryptoKey,
  newPassword: string,
): Promise<WrappedKeyBundle> {
  return wrapMasterKey(masterKey, newPassword);
}
