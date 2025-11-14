// app/api/tickets/recent/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

export async function GET(_req: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select("id, tipster_id, title, description, total_odds, bookmaker, confidence_level, price, posted_at")
      .eq("type", "premium")
      .order("posted_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const tipsterIds = (data ?? []).map((r) => r.tipster_id);
    const { data: profs } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url")
      .in("user_id", tipsterIds);

    const pmap = new Map<string, { name: string; photo: string | null }>();
    (profs ?? []).forEach((p) => pmap.set(p.user_id, { name: p.display_name ?? "Tipster", photo: p.profile_photo_url ?? null }));

    const items = (data ?? []).map((r) => ({
      id: r.id as string,
      tipster: {
        id: r.tipster_id as string,
        name: pmap.get(r.tipster_id)?.name ?? "Tipster",
        photo: pmap.get(r.tipster_id)?.photo ?? null,
      },
      postedAt: r.posted_at as string,
      title: r.title as string,
      description: (r.description as string) ?? null,
      odds: (r.total_odds as number) ?? null,
      bookmaker: (r.bookmaker as Bookmaker) ?? null,
      confidence: Number(r.confidence_level),
      priceNGN: Math.round(Number(r.price) / 100),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
