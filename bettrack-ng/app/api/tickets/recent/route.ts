// app/api/tickets/recent/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

/** Exact columns we read from "tickets" */
type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type TicketStatus = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

type TicketDBRow = {
  id: string;
  type: TicketType;
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number | null;
  match_details: unknown;
  booking_code: string | null;
  status: TicketStatus;
  posted_at: string;
  tipster_id: string;
  is_active: boolean;
};

type TipsterProfilePreview = {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean | null;
};

type FeedItem = Omit<TicketDBRow, "is_active"> & {
  tipster: {
    display_name: string;
    profile_photo_url: string | null;
    is_verified: boolean;
  } | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") || 20))
  );

  // 1) Get recent active tickets
  const { data: rowsRaw, error } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id, type, title, description, total_odds, bookmaker, confidence_level,
      match_details, booking_code, status, posted_at, tipster_id, is_active
    `
    )
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const rows: TicketDBRow[] = (rowsRaw || []) as TicketDBRow[];

  // 2) Gather unique tipster user_ids to fetch profile previews
  const tipsterIds: string[] = Array.from(
    new Set(rows.map((r: TicketDBRow) => r.tipster_id))
  );

  // 3) Fetch tipster previews
  const profiles: Record<
    string,
    {
      display_name: string;
      profile_photo_url: string | null;
      is_verified: boolean;
    }
  > = {};

  if (tipsterIds.length > 0) {
    const { data: pf, error: pfErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url, is_verified")
      .in("user_id", tipsterIds);

    if (!pfErr && pf) {
      for (const p of pf as TipsterProfilePreview[]) {
        profiles[p.user_id] = {
          display_name: p.display_name,
          profile_photo_url: p.profile_photo_url ?? null,
          is_verified: Boolean(p.is_verified),
        };
      }
    }
  }

  // 4) Build feed items with attached tipster preview
  const items: FeedItem[] = rows.map((r: TicketDBRow) => {
    const { is_active, ...rest } = r;
    const tipster = profiles[r.tipster_id] ?? null;
    return { ...rest, tipster };
  });

  return NextResponse.json({ ok: true, items });
}
