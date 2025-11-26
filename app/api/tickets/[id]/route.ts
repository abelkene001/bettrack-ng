// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUserByTelegramId, hasPurchasedTicket } from "@/lib/supabaseAdmin";
import { formatErrorResponse, NotFoundError } from "@/lib/errors";
import { koboToNaira } from "@/lib/paystack";
import type { TicketDetailData, Bookmaker, TicketStatus } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const telegramId = request.headers.get("x-telegram-id");

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      throw new NotFoundError("Ticket not found");
    }

    // Get tipster profile
    const { data: profile } = await supabaseAdmin
      .from("tipster_profiles")
      .select("display_name, profile_photo_url, is_verified")
      .eq("user_id", ticket.tipster_id)
      .maybeSingle();

    // Check if user has purchased this ticket
    let isPurchased = false;
    if (telegramId) {
      const user = await getUserByTelegramId(telegramId);
      if (user) {
        isPurchased = await hasPurchasedTicket(user.id, ticketId);
      }
    }

    // Format response
    const response: TicketDetailData = {
      id: ticket.id,
      tipster: {
        id: ticket.tipster_id,
        name: profile?.display_name || "Tipster",
        photo: profile?.profile_photo_url || null,
        verified: profile?.is_verified || false,
      },
      postedAt: ticket.posted_at,
      title: ticket.title,
      description: ticket.description,
      odds: ticket.total_odds,
      bookmaker: ticket.bookmaker as Bookmaker,
      confidence: ticket.confidence_level,
      priceNGN: koboToNaira(ticket.price),
      bookingCode: isPurchased ? ticket.booking_code : null,
      status: ticket.status as TicketStatus,
      isPurchased,
    };

    return NextResponse.json({
      ok: true,
      data: response,
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
