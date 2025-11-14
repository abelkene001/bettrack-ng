// app/api/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getTelegramIdFromHeaders } from "../../../../lib/telegram";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const telegramId = getTelegramIdFromHeaders(req);

    const { data: t, error: tErr } = await supabaseAdmin
      .from("tickets")
      .select(
        "id, tipster_id, title, description, total_odds, bookmaker, confidence_level, price, posted_at, booking_code"
      )
      .eq("id", id)
      .maybeSingle();

    if (tErr || !t) return NextResponse.json({ ok: false, error: tErr?.message ?? "Not found" }, { status: 404 });

    const { data: prof } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url")
      .eq("user_id", t.tipster_id)
      .maybeSingle();

    let hasAccess = false;
    if (telegramId) {
      const { data: buyer } = await supabaseAdmin.from("users").select("id").eq("telegram_id", telegramId).maybeSingle();
      if (buyer) {
        const { data: pur } = await supabaseAdmin
          .from("purchases")
          .select("id")
          .eq("buyer_id", buyer.id)
          .eq("ticket_id", t.id)
          .eq("payment_status", "completed")
          .maybeSingle();
        hasAccess = Boolean(pur);
      }
    }

    return NextResponse.json({
      ok: true,
      ticket: {
        id: t.id as string,
        title: t.title as string,
        description: (t.description as string) ?? null,
        postedAt: t.posted_at as string,
        odds: (t.total_odds as number) ?? null,
        bookmaker: (t.bookmaker as Bookmaker) ?? null,
        confidence: Number(t.confidence_level),
        priceNGN: Math.round(Number(t.price) / 100),
        tipster: {
          id: t.tipster_id as string,
          name: prof?.display_name ?? "Tipster",
          photo: prof?.profile_photo_url ?? null,
          verified: false,
        },
        bookingCode: hasAccess ? ((t.booking_code as string | null) ?? null) : null,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
