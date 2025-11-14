// app/api/tickets/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getTelegramIdFromHeaders } from "../../../../lib/telegram";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export async function POST(req: Request) {
  try {
    const telegramId = getTelegramIdFromHeaders(req);
    if (!telegramId) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

    // ensure user is a tipster & approved
    const { data: user } = await supabaseAdmin.from("users").select("id, role").eq("telegram_id", telegramId).maybeSingle();
    if (!user || user.role !== "tipster") return NextResponse.json({ ok: false, error: "Tipster only" }, { status: 403 });

    const { data: prof } = await supabaseAdmin
      .from("tipster_profiles")
      .select("is_approved")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!prof || !prof.is_approved) return NextResponse.json({ ok: false, error: "Not approved" }, { status: 403 });

    const body = (await req.json()) as {
      title: string;
      description?: string;
      total_odds: number;
      bookmaker: Bookmaker;
      confidence: number;
      priceNGN: number;
      booking_code: string;
    };

    if (!body.title || !body.total_odds || !body.bookmaker || !body.confidence || !body.priceNGN || !body.booking_code) {
      return NextResponse.json({ ok: false, error: "All fields are required" }, { status: 400 });
    }

    const { data: t, error: tErr } = await supabaseAdmin
      .from("tickets")
      .insert({
        tipster_id: user.id,
        type: "premium",
        title: body.title,
        description: body.description ?? null,
        total_odds: body.total_odds,
        bookmaker: body.bookmaker,
        confidence_level: body.confidence,
        price: Math.round(body.priceNGN * 100),
        booking_code: body.booking_code,
        status: "pending",
        posted_at: new Date().toISOString(),
        match_details: null,
      })
      .select("id")
      .maybeSingle();

    if (tErr || !t) return NextResponse.json({ ok: false, error: tErr?.message ?? "Create failed" }, { status: 500 });
    return NextResponse.json({ ok: true, id: t.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
