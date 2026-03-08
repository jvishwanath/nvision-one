// NextAuth route removed — auth is now handled by Supabase.
// This file is kept as a placeholder to avoid 404s during transition.
export function GET() {
  return Response.json({ message: "Auth is handled by Supabase" }, { status: 410 });
}

export function POST() {
  return Response.json({ message: "Auth is handled by Supabase" }, { status: 410 });
}
