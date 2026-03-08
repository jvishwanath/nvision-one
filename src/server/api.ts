import { createClient } from "@/lib/supabase/server";

export type ApiErrorShape = {
  error: string;
  details?: unknown;
};

export function jsonError(error: string, status: number, details?: unknown) {
  return Response.json({ error, details } satisfies ApiErrorShape, { status });
}

export async function requireUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return user.id;
}
