// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
    getUserByTelegramId,
    getTipsterProfile,
    supabaseAdmin,
} from "@/lib/supabaseAdmin";
import { formatErrorResponse, AuthenticationError } from "@/lib/errors";

export async function GET(request: NextRequest) {
    try {
        const telegramId = request.headers.get("x-telegram-id");
        if (!telegramId) {
            throw new AuthenticationError();
        }

        const user = await getUserByTelegramId(telegramId);
        if (!user) {
            throw new AuthenticationError("User not found");
        }

        // Get purchase count
        const { count: purchaseCount } = await supabaseAdmin
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("buyer_id", user.id)
            .eq("payment_status", "completed");

        // Get tipster profile if applicable
        let tipsterProfile = null;
        if (user.role === "tipster") {
            tipsterProfile = await getTipsterProfile(user.id);
        }

        return NextResponse.json({
            ok: true,
            data: {
                user: {
                    id: user.id,
                    telegram_id: user.telegram_id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                },
                stats: {
                    purchases: purchaseCount || 0,
                },
                tipster: tipsterProfile,
            },
        });
    } catch (error) {
        return formatErrorResponse(error);
    }
}
