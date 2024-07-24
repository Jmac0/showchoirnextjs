import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest, res: NextResponse) {
  return null;
}

export const config = {
  matcher: [
    {
      matcher: "/demo",
      middleware,
    },
  ],
};
