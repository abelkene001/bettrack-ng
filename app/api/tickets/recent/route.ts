// app/api/tickets/recent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatErrorResponse } from "@/lib/errors";
import { koboToNaira } from "@/lib/paystack";
import type { TicketCardData, Bookmaker } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Fetch recent premium tickets
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from("tickets")
      .select("id, tipster_id, title, description, total_odds, bookmaker, confidence_level, price, posted_at")
      .eq("type", "premium")
      .order("posted_at", { ascending: false })
      .limit(20);

    if (ticketsError) {
      throw new Error(ticketsError.message);
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Get tipster profiles
    const tipsterIds = tickets.map((t) => t.tipster_id);
    const { data: profiles } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url, is_verified")
      .in("user_id", tipsterIds);

    // Create a map of tipster profiles
    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.user_id,
        {
          name: p.display_name || "Tipster",
          photo: p.profile_photo_url,
          verified: p.is_verified || false,
        },
      ])
    );

    // Format response
    const formattedTickets: TicketCardData[] = tickets.map((ticket) => {
      const tipster = profileMap.get(ticket.tipster_id) || {
        name: "Tipster",
        photo: null,
        verified: false,
      };

      return {
        id: ticket.id,
        tipster: {
          id: ticket.tipster_id,
          name: tipster.name,
          photo: tipster.photo,
          verified: tipster.verified,
        },
        postedAt: ticket.posted_at,
        title: ticket.title,
        description: ticket.description,
        odds: ticket.total_odds,
        bookmaker: ticket.bookmaker as Bookmaker,
        confidence: ticket.confidence_level,
        priceNGN: koboToNaira(ticket.price),
      };
    });

    return NextResponse.json({
      ok: true,
      data: formattedTickets,
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
