// app/api/purchases/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserByTelegramId,
  hasPurchasedTicket,
} from "@/lib/supabaseAdmin";
import {
  formatErrorResponse,
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "@/lib/errors";
import { generatePaymentReference } from "@/lib/paystack";
import type { CreatePurchaseRequest, CreatePurchaseResponse } from "@/types";

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

    // Parse request
    const body: CreatePurchaseRequest = await request.json();

    if (!body.ticket_id) {
      throw new ValidationError("Ticket ID is required");
    }

    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .select("id, price, tipster_id")
      .eq("id", body.ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      throw new NotFoundError("Ticket not found");
    }

    // Check if user already purchased this ticket
    const alreadyPurchased = await hasPurchasedTicket(user.id, body.ticket_id);
    if (alreadyPurchased) {
      throw new ValidationError("You already purchased this ticket");
    }

    // Check if user is trying to buy their own ticket
    if (ticket.tipster_id === user.id) {
      throw new ValidationError("You cannot purchase your own ticket");
    }

    // Generate payment reference
    const reference = generatePaymentReference("BT");

    // Create purchase record
    const { error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .insert({
        ticket_id: body.ticket_id,
        buyer_id: user.id,
        payment_method: body.method || "paystack",
        payment_reference: reference,
        payment_status: "pending",
        amount_paid: ticket.price,
        created_at: new Date().toISOString(),
      });

    if (purchaseError) {
      throw new Error(`Failed to create purchase: ${purchaseError.message}`);
    }

    // Generate email for Paystack (use telegram_id as fallback)
    const email = user.username
      ? `${user.username}@telegram.user`
      : `${telegramId}@telegram.user`;

    const response: CreatePurchaseResponse = {
      ok: true,
      reference,
      amount_kobo: ticket.price,
      email,
    };

    return NextResponse.json(response);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
