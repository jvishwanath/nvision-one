import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = pathname.startsWith("/api/auth/") || pathname === "/api/health";
  const isPublicPage = pathname === "/login" || pathname === "/register";
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthed = Boolean(token?.sub || token?.userId);

  if ((isApi && !isPublicApi) || (!isApi && !isPublicPage)) {
    if (!isAuthed) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
