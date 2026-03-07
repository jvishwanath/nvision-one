import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function externalUrl(path: string, req: NextRequest): URL {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return new URL(path, `${proto}://${forwardedHost}`);
  }
  return new URL(path, req.url);
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = pathname.startsWith("/api/auth/") || pathname === "/api/health";
  const isPublicPage = pathname === "/login" || pathname === "/register";
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const isSecure = forwardedProto === "https" || req.nextUrl.protocol === "https:";

  let token = await getToken({
    req,
    secret,
    secureCookie: isSecure,
    cookieName: isSecure ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: isSecure,
      cookieName: isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    });
  }

  const isAuthed = Boolean(token?.sub || token?.userId);

  if ((isApi && !isPublicApi) || (!isApi && !isPublicPage)) {
    if (!isAuthed) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(externalUrl("/login", req));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthed) {
    return NextResponse.redirect(externalUrl("/", req));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
