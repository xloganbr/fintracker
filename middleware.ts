import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Check if the route is protected
    const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

    // If accessing a protected route without authentication
    if (isProtectedRoute && !token) {
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "AuthRequired");
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*"],
};
