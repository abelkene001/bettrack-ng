// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateTelegramInitData } from "./lib/telegram";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to API routes
    if (pathname.startsWith("/api")) {
        // Skip auth for public endpoints
        const publicEndpoints = ["/api/health"];
        if (publicEndpoints.includes(pathname)) {
            return NextResponse.next();
        }

        // Get Telegram initData from header or query
        const initData =
            request.headers.get("x-telegram-init-data") ||
            request.nextUrl.searchParams.get("initData") ||
            "";

        // Validate Telegram data
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json(
                { ok: false, error: "Server configuration error" },
                { status: 500 }
            );
        }

        const validation = validateTelegramInitData(initData, botToken);

        if (!validation.ok) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized", reason: validation.reason },
                { status: 401 }
            );
        }

        // Add telegram user ID to headers for downstream use
        const telegramId = String(validation.user?.id || "");
        const response = NextResponse.next();
        response.headers.set("x-telegram-id", telegramId);
        response.headers.set(
            "x-telegram-user",
            JSON.stringify(validation.user || {})
        );

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"],
};
