// app/api/tickets/mine/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

/* ---------------- Types ---------------- */

type Mode = "bettor" | "tipster";
type Status = "all" | "pending" | "won" | "lost";
type Range = "7" | "30" | "all";
type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";

type TipsterObj = {
  display_name: string;
  profile_photo_url: string | null;
  is_verified: boolean;
};

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
  tipster: TipsterObj | null;
};

/* -------------- Helpers --------------- */

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function getRangeStart(range: Range): string | null {
  if (range === "all") return null;
  const days = range === "7" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function shapeTicket(
  raw: Record<string, unknown>,
  tipster: TipsterObj | null
): TicketRow {
  const type = raw.type === "premium" ? "premium" : "free";
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

  const status: "pending" | "won" | "lost" =
    raw.status === "won" || raw.status === "lost"
      ? (raw.status as "won" | "lost")
      : "pending";

  const posted_at =
    typeof raw.posted_at === "string"
      ? raw.posted_at
      : new Date().toISOString();

  return {
    id: String(raw.id ?? ""),
    type,
    title,
    description,
    total_odds,
    bookmaker,
    confidence_level,
    match_details: raw.match_details ?? null,
    booking_code:
      typeof raw.booking_code === "string" ? raw.booking_code : null,
    status,
    posted_at,
    tipster,
  };
}

/* --------------- Handler -------------- */

export async function GET(req: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return bad("NO_SESSION", 401);

  let sess: { sub: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return bad("BAD_SESSION", 401);
  }

  const telegramId = Number(sess.sub);
  if (!Number.isFinite(telegramId)) return bad("BAD_TELEGRAM_ID");

  // resolve current user
  const { data: userRow, error: uErr } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (uErr) return bad(uErr.message, 500);
  if (!userRow?.id) return bad("USER_NOT_FOUND", 401);

  // parse filters
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "bettor") as Mode;
  const status = (url.searchParams.get("status") || "all") as Status;
  const range = (url.searchParams.get("range") || "7") as Range;
  const since = getRangeStart(range);

  /* -------- TIPSTER MODE: tickets I posted -------- */
  if (mode === "tipster") {
    let tq = supabaseAdmin
      .from("tickets")
      .select(
        "id, type, title, description, total_odds, bookmaker, confidence_level, match_details, booking_code, status, posted_at, tipster_id"
      )
      .eq("tipster_id", userRow.id)
      .order("posted_at", { ascending: false })
      .limit(150);

    if (status !== "all") tq = tq.eq("status", status);
    if (since) tq = tq.gte("posted_at", since);

    const { data: tRows, error: tErr } = await tq;
    if (tErr) return bad(tErr.message, 500);

    // fetch the single tipster profile for this user
    const { data: pRow, error: pErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("display_name, profile_photo_url, is_verified")
      .eq("user_id", userRow.id)
      .maybeSingle();
    if (pErr) return bad(pErr.message, 500);

    const tipster: TipsterObj | null = pRow
      ? {
          display_name: String(pRow.display_name ?? "Tipster"),
          profile_photo_url: pRow.profile_photo_url
            ? String(pRow.profile_photo_url)
            : null,
          is_verified: Boolean(pRow.is_verified),
        }
      : null;

    const items: TicketRow[] = (tRows ?? []).map((r: unknown) =>
      shapeTicket(r as Record<string, unknown>, tipster)
    );

    return NextResponse.json({ ok: true, items });
  }

  /* -------- BETTOR MODE: tickets I purchased -------- */
  // Step 1: get my purchases (optionally filtered by purchase date)
  let pq = supabaseAdmin
    .from("purchases")
    .select("ticket_id, purchased_at")
    .eq("buyer_id", userRow.id)
    .order("purchased_at", { ascending: false })
    .limit(200);

  if (since) pq = pq.gte("purchased_at", since);

  const { data: pRows, error: pErr } = await pq;
  if (pErr) return bad(pErr.message, 500);

  const ticketIds = (pRows ?? [])
    .map((r: unknown) =>
      r && typeof r === "object"
        ? (r as Record<string, unknown>).ticket_id
        : null
    )
    .filter((v: unknown): v is string => typeof v === "string");

  if (ticketIds.length === 0) {
    return NextResponse.json({ ok: true, items: [] });
  }

  // Step 2: fetch tickets by id IN (...)
  let tq = supabaseAdmin
    .from("tickets")
    .select(
      "id, type, title, description, total_odds, bookmaker, confidence_level, match_details, booking_code, status, posted_at, tipster_id"
    )
    .in("id", ticketIds)
    .order("posted_at", { ascending: false })
    .limit(200);

  if (status !== "all") tq = tq.eq("status", status);

  const { data: tRows, error: tErr } = await tq;
  if (tErr) return bad(tErr.message, 500);

  // fetch profiles for all tipster_ids in one go
  const tipsterIds = Array.from(
    new Set(
      (tRows ?? [])
        .map((r: unknown) => {
          const rec = r as { tipster_id?: unknown };
          return typeof rec.tipster_id === "string" ? rec.tipster_id : null;
        })
        .filter((v: string | null): v is string => typeof v === "string")
    )
  );

  const profilesByUserId = new Map<string, TipsterObj>();
  if (tipsterIds.length) {
    const { data: profs, error: profErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("user_id, display_name, profile_photo_url, is_verified")
      .in("user_id", tipsterIds);
    if (profErr) return bad(profErr.message, 500);
    for (const row of profs ?? []) {
      profilesByUserId.set(String(row.user_id), {
        display_name: String(row.display_name ?? "Tipster"),
        profile_photo_url: row.profile_photo_url
          ? String(row.profile_photo_url)
          : null,
        is_verified: Boolean(row.is_verified),
      });
    }
  }

  const items: TicketRow[] = (tRows ?? []).map((r: unknown) => {
    const rec = r as Record<string, unknown>;
    const tOwner = String(rec.tipster_id ?? "");
    const tipster = profilesByUserId.get(tOwner) ?? null;
    return shapeTicket(rec, tipster);
  });

  // Optional: sort by purchase time instead of posted time
  const purchaseOrder = new Map<string, number>();
  (pRows ?? []).forEach((pr: unknown, idx: number) => {
    const rec = pr as Record<string, unknown>;
    const id = rec.ticket_id;
    if (typeof id === "string" && !purchaseOrder.has(id)) {
      purchaseOrder.set(id, idx);
    }
  });

  items.sort((a: TicketRow, b: TicketRow) => {
    const ia = purchaseOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const ib = purchaseOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ia - ib;
  });

  return NextResponse.json({ ok: true, items });
}
