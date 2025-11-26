// app/api/ratings/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getTelegramIdFromHeaders } from "../../../../lib/telegram";

export async function POST(req: Request) {
  try {
    const telegramId = getTelegramIdFromHeaders(req);
    if (!telegramId) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

    const body = (await req.json()) as { ticket_id: string; rating: number; comment?: string };
    if (!body.ticket_id || !body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ ok: false, error: "Invalid rating payload" }, { status: 400 });
    }

    const { data: buyer } = await supabaseAdmin.from("users").select("id").eq("telegram_id", telegramId).maybeSingle();
    if (!buyer) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { data: pur } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("ticket_id", body.ticket_id)
      .eq("buyer_id", buyer.id)
      .eq("payment_status", "completed")
      .maybeSingle();
    if (!pur) return NextResponse.json({ ok: false, error: "Purchase required to rate" }, { status: 403 });

    const { error: insErr } = await supabaseAdmin.from("reviews").insert({
      ticket_id: body.ticket_id,
      purchase_id: pur.id,
      buyer_id: buyer.id,
      tipster_id: null,
      rating: body.rating,
      comment: body.comment ?? null,
      created_at: new Date().toISOString(),
    });
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
