// app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  formatErrorResponse,
  ValidationError,
  NotFoundError,
  PaymentError,
} from "@/lib/errors";
import { verifyPaystackTransaction } from "@/lib/paystack";
import type { VerifyPaymentRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();

    if (!body.reference) {
      throw new ValidationError("Payment reference is required");
    }

    // Find purchase by reference
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .select("id, ticket_id, buyer_id, payment_status, amount_paid")
      .eq("payment_reference", body.reference)
      .maybeSingle();

    if (purchaseError || !purchase) {
      throw new NotFoundError("Purchase not found");
    }

    // Check if already completed (idempotency)
    if (purchase.payment_status === "completed") {
      return NextResponse.json({
        ok: true,
        data: { message: "Payment already verified" },
      });
    }

    // Verify with Paystack
    const verification = await verifyPaystackTransaction(body.reference);

    if (verification.status !== "success") {
      throw new PaymentError(`Payment ${verification.status}`);
    }

    // Verify amount matches
    if (verification.amount !== purchase.amount_paid) {
      throw new PaymentError("Payment amount mismatch");
    }

    // Update purchase status
    const { error: updateError } = await supabaseAdmin
      .from("purchases")
      .update({
        payment_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    if (updateError) {
      throw new Error(`Failed to update purchase: ${updateError.message}`);
    }

    // Send Telegram notification (optional, don't fail if it errors)
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const { data: buyer } = await supabaseAdmin
          .from("users")
          .select("telegram_id")
          .eq("id", purchase.buyer_id)
          .maybeSingle();

        if (buyer?.telegram_id) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: buyer.telegram_id,
              text: "✅ Payment confirmed! Your ticket has been unlocked. Tap to view the booking code.",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "View Ticket",
                      url: `https://t.me/YOUR_BOT_USERNAME/app?startapp=ticket_${purchase.ticket_id}`,
                    },
                  ],
                ],
              },
            }),
          });
        }
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Don't throw - notification failure shouldn't fail the payment
    }

    return NextResponse.json({
      ok: true,
      data: { message: "Payment verified successfully" },
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
