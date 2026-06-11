import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const correlationId =
    request.headers.get("x-correlation-id") ??
    crypto.randomUUID();

  const headers = new Headers(request.headers);

  headers.set("x-correlation-id", correlationId);

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  response.headers.set("x-correlation-id", correlationId);

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};