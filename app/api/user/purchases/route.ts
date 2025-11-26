// app/api/user/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatErrorResponse, AuthenticationError } from "@/lib/errors";
import { koboToNaira } from "@/lib/paystack";
import type { PurchaseHistoryItem, PaymentStatus, TicketStatus } from "@/types";

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

        // Get purchases with ticket info
        const { data: purchases, error } = await supabaseAdmin
            .from("purchases")
            .select(
                `
        id,
        ticket_id,
        amount_paid,
        payment_status,
        created_at,
        tickets (
          id,
          title,
          total_odds,
          status
        )
      `
            )
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            throw new Error(error.message);
        }

        const formattedPurchases: PurchaseHistoryItem[] = (purchases || []).map(
            (p: any) => ({
                id: p.id,
                ticket: {
                    id: p.tickets.id,
                    title: p.tickets.title,
                    odds: p.tickets.total_odds,
                    status: p.tickets.status as TicketStatus,
                },
                amount_paid: koboToNaira(p.amount_paid),
                payment_status: p.payment_status as PaymentStatus,
                created_at: p.created_at,
            })
        );

        return NextResponse.json({
            ok: true,
            data: formattedPurchases,
        });
    } catch (error) {
        return formatErrorResponse(error);
    }
}
