import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicKey, getSupabaseUrl } from "./public-config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let url: string;
  let key: string;
  try {
    url = getSupabaseUrl();
    key = getSupabasePublicKey();
  } catch {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (user && (path === "/anmelden" || path === "/registrieren")) {
    return NextResponse.redirect(new URL("/turniere", request.url));
  }

  if (
    !user &&
    (path.startsWith("/dashboard") ||
      path.startsWith("/turniere") ||
      path.startsWith("/konto"))
  ) {
    return NextResponse.redirect(new URL("/anmelden", request.url));
  }

  return response;
}
