import { auth } from "@/server/auth";

export type ApiErrorShape = {
  error: string;
  details?: unknown;
};

export function jsonError(error: string, status: number, details?: unknown) {
  return Response.json({ error, details } satisfies ApiErrorShape, { status });
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
