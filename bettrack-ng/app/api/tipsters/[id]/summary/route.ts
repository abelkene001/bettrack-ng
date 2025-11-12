// app/api/tipsters/[id]/summary/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

type DBProfile = {
  display_name: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number | null;
  total_tickets_posted: number | null;
  total_tickets_sold: number | null;
  average_rating: number | string | null;
  is_verified: boolean | null;
};

type TipsterProfile = {
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number;
  total_tickets_posted: number;
  total_tickets_sold: number;
  average_rating: number | null;
  is_verified: boolean;
};

type DBTicketRow = {
  id: string;
  type: "free" | "premium";
  title: string | null;
  description: string | null;
  total_odds: number | string | null;
  bookmaker: Bookmaker | null;
  confidence_level: number | string | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost" | null;
  posted_at: string | null;
};

type TipTicket = {
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
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
}

function toBookmaker(v: unknown): Bookmaker | null {
  if (
    v === "bet9ja" ||
    v === "sportybet" ||
    v === "1xbet" ||
    v === "betking" ||
    v === "other"
  )
    return v;
  return null;
}

function toStatus(v: unknown): "pending" | "won" | "lost" {
  if (v === "won" || v === "lost") return v;
  return "pending";
}

// ✅ The key fix: destructure the 2nd arg as `{ params }` and type it inline.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) return bad("MISSING_ID", 400);

  // 1) profile
  const { data: prof, error: pErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select(
      "display_name, bio, profile_photo_url, total_followers, total_tickets_posted, total_tickets_sold, average_rating, is_verified"
    )
    .eq("user_id", id)
    .maybeSingle();

  if (pErr) return bad(pErr.message, 500);
  if (!prof) return bad("NOT_FOUND", 404);

  const p = prof as DBProfile;

  const profile: TipsterProfile = {
    display_name: String(p.display_name ?? "Tipster"),
    bio: p.bio ? String(p.bio) : null,
    profile_photo_url: p.profile_photo_url ? String(p.profile_photo_url) : null,
    total_followers: Number(p.total_followers ?? 0),
    total_tickets_posted: Number(p.total_tickets_posted ?? 0),
    total_tickets_sold: Number(p.total_tickets_sold ?? 0),
    average_rating:
      typeof p.average_rating === "number"
        ? p.average_rating
        : toNumberOrNull(p.average_rating),
    is_verified: Boolean(p.is_verified),
  };

  // 2) recent tickets
  const { data: tRows, error: tErr } = await supabaseAdmin
    .from("tickets")
    .select(
      "id, type, title, description, total_odds, bookmaker, confidence_level, match_details, booking_code, status, posted_at"
    )
    .eq("tipster_id", id)
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (tErr) return bad(tErr.message, 500);

  const tickets: TipTicket[] = (tRows ?? []).map(
    (row: Record<string, unknown>): TipTicket => {
      const totalOdds = toNumberOrNull(row.total_odds);
      const conf = toNumberOrNull(row.confidence_level);
      return {
        id: String(row.id),
        type: (row.type as string) === "premium" ? "premium" : "free",
        title: String((row.title as string) ?? "Ticket"),
        description: (row.description as string) ?? null,
        total_odds: totalOdds,
        bookmaker: toBookmaker(row.bookmaker),
        confidence_level: conf,
        match_details: row.match_details,
        booking_code:
          typeof row.booking_code === "string" ? row.booking_code : null,
        status: toStatus(row.status),
        posted_at:
          typeof row.posted_at === "string"
            ? row.posted_at
            : new Date().toISOString(),
      };
    }
  );

  return NextResponse.json({ ok: true, profile, tickets });
}
