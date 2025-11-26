// app/api/tickets/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserByTelegramId,
  getTipsterProfile,
} from "@/lib/supabaseAdmin";
import {
  formatErrorResponse,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/errors";
import { nairaToKobo } from "@/lib/paystack";
import type { CreateTicketForm, Bookmaker } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const telegramId = request.headers.get("x-telegram-id");
    if (!telegramId) {
      throw new AuthenticationError();
    }

    // Get user
    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Check if user is a tipster
    if (user.role !== "tipster") {
      throw new AuthorizationError("Only tipsters can create tickets");
    }

    // Check if tipster is approved
    const profile = await getTipsterProfile(user.id);
    if (!profile || !profile.is_approved) {
      throw new AuthorizationError("Tipster not approved");
    }

    // Parse and validate request body
    const body: CreateTicketForm = await request.json();

    if (!body.title || body.title.trim().length === 0) {
      throw new ValidationError("Title is required");
    }

    if (!body.total_odds || body.total_odds < 1) {
      throw new ValidationError("Valid odds are required");
    }

    if (!body.bookmaker) {
      throw new ValidationError("Bookmaker is required");
    }

    if (!body.confidence || body.confidence < 1 || body.confidence > 10) {
      throw new ValidationError("Confidence must be between 1 and 10");
    }

    if (!body.priceNGN || body.priceNGN < 0) {
      throw new ValidationError("Valid price is required");
    }

    if (!body.booking_code || body.booking_code.trim().length === 0) {
      throw new ValidationError("Booking code is required");
    }

    // Create ticket
    const { data: ticket, error: insertError } = await supabaseAdmin
      .from("tickets")
      .insert({
        tipster_id: user.id,
        type: "premium",
        title: body.title.trim(),
        description: body.description?.trim() || null,
        total_odds: body.total_odds,
        bookmaker: body.bookmaker,
        confidence_level: body.confidence,
        price: nairaToKobo(body.priceNGN),
        booking_code: body.booking_code.trim(),
        status: "pending",
        posted_at: new Date().toISOString(),
        match_details: null,
      })
      .select("id")
      .single();

    if (insertError || !ticket) {
      throw new Error(`Failed to create ticket: ${insertError?.message}`);
    }

    return NextResponse.json({
      ok: true,
      data: { id: ticket.id },
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
