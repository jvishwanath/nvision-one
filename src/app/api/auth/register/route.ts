// Registration is now handled client-side via Supabase Auth.
// This route is kept as a stub for backward compatibility.
export function POST() {
  return Response.json(
    { message: "Registration is now handled by Supabase Auth client-side." },
    { status: 410 },
  );
}
