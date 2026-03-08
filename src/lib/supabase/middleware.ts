import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = pathname === "/api/health";
  const isPublicPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/auth/callback";
  const isAuthed = !!user;

  if ((isApi && !isPublicApi) || (!isApi && !isPublicPage)) {
    if (!isAuthed) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto");
      let loginUrl: URL;
      if (forwardedHost) {
        loginUrl = new URL("/login", `${forwardedProto ?? "https"}://${forwardedHost}`);
      } else {
        loginUrl = new URL("/login", request.url);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isPublicPage && isAuthed) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    let homeUrl: URL;
    if (forwardedHost) {
      homeUrl = new URL("/", `${forwardedProto ?? "https"}://${forwardedHost}`);
    } else {
      homeUrl = new URL("/", request.url);
    }
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
