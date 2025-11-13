// app/api/tickets/recent/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

type TipsterObj = {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

type TicketRow = {
  id: string;
  tipster_id: string;
  type: TicketType;
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number; // required by your rule
  booking_code: string | null;
  posted_at: string; // ISO
  status: Status;
  price: number | null; // premium price in kobo (nullable for free)
};

type FeedItem = {
  id: string;
  tipster: {
    id: string;
    name: string;
    photo: string | null;
    verified: boolean;
  };
  postedAt: string; // ISO string
  status: Status;
  type: TicketType;
  title: string;
  description: string | null;
  odds: number | null;
  bookmaker: Bookmaker | null;
  confidence: number;
  bookingCode: string | null; // only shown for FREE
  priceNGN: number | null; // only shown for PREMIUM (in naira)
};

type TipsterProfileRow = {
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  is_verified: boolean | null;
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor"); // ISO posted_at cursor (exclusive)
  const limit = Math.min(Math.max(Number(limitParam || 10), 1), 25); // 1..25

  // 1) Fetch tickets page (no fragile joins)
  let tq = supabaseAdmin
    .from("tickets")
    .select(
      "id, tipster_id, type, title, description, total_odds, bookmaker, confidence_level, booking_code, posted_at, status, price"
    )
    .order("posted_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    // only rows posted BEFORE cursor (desc order)
    tq = tq.lt("posted_at", cursor);
  }

  const { data: rows, error: tErr } = await tq;
  if (tErr) return bad(tErr.message, 500);

  const items = (rows ?? []) as TicketRow[];

  // 2) Fetch tipster profiles in one query
  const tipsterIds = Array.from(new Set(items.map((r) => r.tipster_id)));
  const tipsterMap = new Map<string, TipsterObj>();

  if (tipsterIds.length) {
    const { data: profs, error: pErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url, is_verified")
      .in("user_id", tipsterIds);
    if (pErr) return bad(pErr.message, 500);

    (profs ?? []).forEach((p: TipsterProfileRow) => {
      tipsterMap.set(String(p.user_id), {
        user_id: String(p.user_id),
        display_name: String(p.display_name ?? "Tipster"),
        profile_photo_url: p.profile_photo_url
          ? String(p.profile_photo_url)
          : null,
        is_verified: Boolean(p.is_verified),
      });
    });
  }

  // 3) Shape response
  const shaped: FeedItem[] = items.slice(0, limit).map((r) => {
    const tp = tipsterMap.get(r.tipster_id);
    return {
      id: r.id,
      tipster: {
        id: r.tipster_id,
        name: tp?.display_name ?? "Tipster",
        photo: tp?.profile_photo_url ?? null,
        verified: tp?.is_verified ?? false, // NOTE: badge support (future)
      },
      postedAt: r.posted_at,
      status: r.status,
      type: r.type,
      title: r.title,
      description: r.description,
      odds: typeof r.total_odds === "number" ? r.total_odds : null,
      bookmaker: r.bookmaker,
      confidence: r.confidence_level,
      bookingCode: r.type === "free" ? r.booking_code ?? null : null,
      priceNGN:
        r.type === "premium" && typeof r.price === "number"
          ? Math.round(r.price / 100) // kobo → naira
          : null,
    };
  });

  const hasMore = items.length > limit;
  const nextCursor = hasMore ? items[limit - 1].posted_at : null;

  return NextResponse.json({ ok: true, items: shaped, nextCursor });
}
