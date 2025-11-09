// app/api/tickets/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

/* ------------------------- Types (no `any`) ------------------------- */

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";

type TipsterObj = {
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

type MatchRow = { home: string; away: string; pick: string; odds: number };

type RawTipster =
  | {
      display_name?: unknown;
      profile_photo_url?: unknown;
      is_verified?: unknown;
    }
  | Array<{
      display_name?: unknown;
      profile_photo_url?: unknown;
      is_verified?: unknown;
    }>;

type RawTicket = {
  id?: unknown;
  type?: unknown;
  title?: unknown;
  description?: unknown;
  total_odds?: unknown;
  bookmaker?: unknown;
  confidence_level?: unknown;
  match_details?: unknown;
  booking_code?: unknown;
  status?: unknown;
  posted_at?: unknown;
  tipster?: RawTipster;
};

/* ------------------------- Helpers ------------------------- */

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function normalizeTipster(raw: RawTipster | undefined): TipsterObj | null {
  if (!raw) return null;

  const pickFields = (
    v:
      | {
          display_name?: unknown;
          profile_photo_url?: unknown;
          is_verified?: unknown;
        }
      | undefined
  ): TipsterObj | null => {
    if (!v) return null;
    const dn = typeof v.display_name === "string" ? v.display_name : null;
    if (!dn) return null;
    const purl =
      typeof v.profile_photo_url === "string" ? v.profile_photo_url : null;
    const ver =
      typeof v.is_verified === "boolean"
        ? v.is_verified
        : Boolean(v.is_verified);
    return { display_name: dn, profile_photo_url: purl, is_verified: ver };
  };

  if (Array.isArray(raw)) {
    return pickFields(raw[0]) ?? null;
  }
  return pickFields(raw) ?? null;
}

function normalizeMatchDetails(val: unknown): MatchRow[] | null {
  if (!Array.isArray(val)) return null;
  const out: MatchRow[] = [];
  for (const m of val) {
    if (m && typeof m === "object") {
      const mm = m as Record<string, unknown>;
      const home = typeof mm.home === "string" ? mm.home : null;
      const away = typeof mm.away === "string" ? mm.away : null;
      const pick = typeof mm.pick === "string" ? mm.pick : null;
      const odds =
        typeof mm.odds === "number"
          ? mm.odds
          : typeof mm.odds === "string"
          ? Number(mm.odds)
          : null;
      if (
        home &&
        away &&
        pick &&
        typeof odds === "number" &&
        !Number.isNaN(odds)
      ) {
        out.push({ home, away, pick, odds });
      }
    }
  }
  return out.length ? out : null;
}

/* ------------------------- Handler ------------------------- */

/**
 * Note: We avoid typing the second ctx param to satisfy Next.js’ strict checker.
 * We extract the ID from the request URL instead.
 */
export async function GET(req: Request) {
  // Extract id from URL: /api/tickets/[id]
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || "";
  if (!id) return bad("MISSING_ID", 400);

  // Get optional session (public view should still work)
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  let currentUserId: string | null = null;
  if (token) {
    try {
      const sess = await verifyAppSession(token);
      const telegramId = Number(sess.sub);
      if (Number.isFinite(telegramId)) {
        const { data: u } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("telegram_id", telegramId)
          .maybeSingle();
        if (u?.id) currentUserId = u.id;
      }
    } catch {
      // ignore session errors; treat as public
    }
  }

  // Fetch the ticket with joined tipster profile
  const { data: rows, error } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id, type, title, description, total_odds, bookmaker, confidence_level,
      match_details, booking_code, status, posted_at, tipster_id,
      tipster:tipster_id (
        display_name, profile_photo_url, is_verified
      )
    `
    )
    .eq("id", id)
    .limit(1);

  if (error) return bad(error.message, 500);
  const raw = (rows?.[0] ?? null) as RawTicket | null;
  if (!raw) return bad("NOT_FOUND", 404);

  // Is it purchased by this user?
  let purchased = false;
  if (currentUserId) {
    const { data: p } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("ticket_id", id)
      .eq("buyer_id", currentUserId)
      .maybeSingle();
    purchased = Boolean(p);
  }

  // Normalize fields with runtime guards (no `any`)
  const tipsterNorm = normalizeTipster(raw.tipster);
  const matchDetailsNorm = normalizeMatchDetails(raw.match_details);

  const type: "free" | "premium" = raw.type === "premium" ? "premium" : "free";

  const title = typeof raw.title === "string" ? raw.title : "Ticket";
  const description =
    typeof raw.description === "string" ? raw.description : null;
  const total_odds =
    typeof raw.total_odds === "number"
      ? raw.total_odds
      : typeof raw.total_odds === "string"
      ? Number(raw.total_odds)
      : null;

  const bookmaker: Bookmaker | null =
    raw.bookmaker === "bet9ja" ||
    raw.bookmaker === "sportybet" ||
    raw.bookmaker === "1xbet" ||
    raw.bookmaker === "betking" ||
    raw.bookmaker === "other"
      ? (raw.bookmaker as Bookmaker)
      : null;

  const confidence_level =
    typeof raw.confidence_level === "number"
      ? raw.confidence_level
      : typeof raw.confidence_level === "string"
      ? Number(raw.confidence_level)
      : null;

  const status: Status =
    raw.status === "won" || raw.status === "lost" ? raw.status : "pending";

  const posted_at =
    typeof raw.posted_at === "string"
      ? raw.posted_at
      : new Date().toISOString();

  // booking code (lock for premium if not purchased)
  let booking_code =
    typeof raw.booking_code === "string" ? raw.booking_code : null;

  let finalMatchDetails = matchDetailsNorm;
  if (type === "premium" && !purchased) {
    booking_code = null;
    finalMatchDetails = null;
  }

  return NextResponse.json({
    ok: true,
    ticket: {
      id: String(raw.id ?? id),
      type,
      title,
      description,
      total_odds,
      bookmaker,
      confidence_level,
      status,
      posted_at,
      tipster: tipsterNorm,
      match_details: finalMatchDetails,
      booking_code,
      purchased,
    },
  });
}
