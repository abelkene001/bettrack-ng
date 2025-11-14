// app/api/purchases/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getTelegramIdFromHeaders } from "../../../../lib/telegram";

export async function POST(req: Request) {
  try {
    const telegramId = getTelegramIdFromHeaders(req);
    if (!telegramId) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

    const body = (await req.json()) as { ticket_id: string; method: "paystack" };
    if (!body.ticket_id || body.method !== "paystack") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const { data: buyer } = await supabaseAdmin
      .from("users")
      .select("id, telegram_id, username, first_name")
      .eq("telegram_id", telegramId)
      .maybeSingle();
    if (!buyer) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { data: t } = await supabaseAdmin
      .from("tickets")
      .select("id, tipster_id, price")
      .eq("id", body.ticket_id)
      .maybeSingle();
    if (!t) return NextResponse.json({ ok: false, error: "Ticket not found" }, { status: 404 });

    const amountKobo = Number(t.price);
    const fee = Math.round(amountKobo * 0.3);
    const tipsterEarn = amountKobo - fee;

    const reference = `BTX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // upsert pending purchase:
    const { data: p, error: pErr } = await supabaseAdmin
      .from("purchases")
      .insert({
        ticket_id: t.id,
        buyer_id: buyer.id,
        amount_paid: amountKobo,
        tipster_earnings: tipsterEarn,
        platform_fee: fee,
        payment_method: "paystack",
        payment_status: "pending",
        payment_reference: reference,
        purchased_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (pErr || !p) return NextResponse.json({ ok: false, error: pErr?.message ?? "Failed" }, { status: 500 });

    // derive email (Paystack requires email); use a synthetic if not present
    const email = buyer.username ? `${buyer.username}@telegram.local` : `u${buyer.id}@telegram.local`;

    return NextResponse.json({
      ok: true,
      reference,
      amount_kobo: amountKobo,
      email,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
