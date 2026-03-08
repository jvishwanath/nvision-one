import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/server/api";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      return jsonError("Encryption not configured", 500);
    }

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const derived = await crypto.subtle.sign(
      "HMAC",
      keyMaterial,
      enc.encode(user.id),
    );

    const bytes = new Uint8Array(derived);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const derivedKeyB64 = btoa(binary);

    return Response.json({ derivedKey: derivedKeyB64 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to derive key", 500);
  }
}
