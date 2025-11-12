// app/api/tickets/recent/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

/** Allowed bookmaker labels (kept narrow for safety) */
type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

/** Raw row coming from "tickets" */
type DBTicket = {
  id: string;
  type: "free" | "premium" | string;
  title: string | null;
  description: string | null;
  total_odds: number | string | null;
  bookmaker: Bookmaker | string | null;
  confidence_level: number | string | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost" | string | null;
  posted_at: string | null;
  tipster_id: string | null;
  is_active?: boolean | null;
};

/** Raw row coming from "tipster_profiles" */
type DBProfileRow = {
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  is_verified: boolean | null;
};

/** The tipster object we attach to each ticket for the feed */
type TipsterObj = {
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

/** Final ticket shape returned by this endpoint */
type TicketRow = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost";
  posted_at: string;
  tipster_id: string;
  tipster: TipsterObj | null;
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function toBookmaker(v: unknown): Bookmaker | null {
  if (
    v === "bet9ja" ||
    v === "sportybet" ||
    v === "1xbet" ||
    v === "betking" ||
    v === "other"
  ) {
    return v;
  }
  return null;
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
}

function toStatus(v: unknown): "pending" | "won" | "lost" {
  if (v === "won" || v === "lost") return v;
  return "pending";
}

function shapeTicket(rec: DBTicket, tipster: TipsterObj | null): TicketRow {
  return {
    id: String(rec.id),
    type: rec.type === "premium" ? "premium" : "free",
    title: rec.title ?? "Ticket",
    description: rec.description ?? null,
    total_odds: toNumberOrNull(rec.total_odds),
    bookmaker: toBookmaker(rec.bookmaker),
    confidence_level: toNumberOrNull(rec.confidence_level),
    match_details: rec.match_details ?? null,
    booking_code:
      typeof rec.booking_code === "string" ? rec.booking_code : null,
    status: toStatus(rec.status),
    posted_at:
      typeof rec.posted_at === "string"
        ? rec.posted_at
        : new Date().toISOString(),
    tipster_id: rec.tipster_id ?? "",
    tipster,
  };
}

export async function GET() {
  // 1) fetch recent tickets
  const { data: tRows, error: tErr } = await supabaseAdmin
    .from("tickets")
    .select(
      "id, type, title, description, total_odds, bookmaker, confidence_level, match_details, booking_code, status, posted_at, tipster_id"
    )
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (tErr) return bad(tErr.message, 500);

  // Ensure each row matches DBTicket
  const tickets: DBTicket[] = (tRows ?? []).map(
    (r: Record<string, unknown>): DBTicket => ({
      id: String(r.id),
      type: (r.type as string) === "premium" ? "premium" : "free",
      title: (r.title as string) ?? null,
      description: (r.description as string) ?? null,
      total_odds: (r.total_odds as number | string | null) ?? null,
      bookmaker: (r.bookmaker as Bookmaker | string | null) ?? null,
      confidence_level: (r.confidence_level as number | string | null) ?? null,
      match_details: r.match_details,
      booking_code: (r.booking_code as string) ?? null,
      status: (r.status as "pending" | "won" | "lost" | string | null) ?? null,
      posted_at: (r.posted_at as string) ?? null,
      tipster_id: (r.tipster_id as string) ?? null,
    })
  );

  // 2) fetch tipster profiles in one query
  const tipsterIds: string[] = Array.from(
    new Set(
      tickets
        .map((rec: DBTicket) => rec.tipster_id)
        .filter(
          (v: string | null): v is string =>
            typeof v === "string" && v.length > 0
        )
    )
  );

  const profilesByUserId = new Map<string, TipsterObj>();
  if (tipsterIds.length) {
    const { data: profs, error: pErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url, is_verified")
      .in("user_id", tipsterIds);

    if (pErr) return bad(pErr.message, 500);

    (profs ?? []).forEach((row: Record<string, unknown>) => {
      const r: DBProfileRow = {
        user_id: String(row.user_id),
        display_name: (row.display_name as string) ?? null,
        profile_photo_url: (row.profile_photo_url as string) ?? null,
        is_verified: Boolean(row.is_verified),
      };
      profilesByUserId.set(r.user_id, {
        display_name: r.display_name ?? "Tipster",
        profile_photo_url: r.profile_photo_url,
        is_verified: Boolean(r.is_verified),
      });
    });
  }

  // 3) final list
  const items: TicketRow[] = tickets.map((rec: DBTicket) => {
    const tipster = rec.tipster_id
      ? profilesByUserId.get(rec.tipster_id) ?? null
      : null;
    return shapeTicket(rec, tipster);
  });

  return NextResponse.json({ ok: true, items });
}
