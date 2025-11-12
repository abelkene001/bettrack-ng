// app/api/tickets/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type MatchRow = { home: string; away: string; pick: string; odds: number };

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function isMatchRowArray(val: unknown): val is MatchRow[] {
  if (!Array.isArray(val)) return false;
  return val.every((m) => {
    if (!m || typeof m !== "object") return false;
    const o = m as Record<string, unknown>;
    return (
      typeof o.home === "string" &&
      typeof o.away === "string" &&
      typeof o.pick === "string" &&
      (typeof o.odds === "number" ||
        (typeof o.odds === "string" && !Number.isNaN(Number(o.odds))))
    );
  });
}

export async function POST(req: Request) {
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

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (!userRow?.id) return bad("USER_NOT_FOUND", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("INVALID_JSON");
  }

  const b = body as Record<string, unknown>;

  // required (shared)
  const tType =
    b.type === "premium" ? "premium" : b.type === "free" ? "free" : null;
  const title =
    typeof b.title === "string" && b.title.trim().length >= 3
      ? b.title.trim()
      : null;
  const bookmaker: Bookmaker | null =
    b.bookmaker === "bet9ja" ||
    b.bookmaker === "sportybet" ||
    b.bookmaker === "1xbet" ||
    b.bookmaker === "betking" ||
    b.bookmaker === "other"
      ? (b.bookmaker as Bookmaker)
      : null;
  const confidence =
    typeof b.confidence_level === "number"
      ? b.confidence_level
      : typeof b.confidence_level === "string"
      ? Number(b.confidence_level)
      : null;
  const total_odds =
    typeof b.total_odds === "number"
      ? b.total_odds
      : typeof b.total_odds === "string"
      ? Number(b.total_odds)
      : null;

  const matches = b.match_details;
  const match_details = isMatchRowArray(matches)
    ? matches.map((m) => ({
        home: m.home,
        away: m.away,
        pick: m.pick,
        odds: typeof m.odds === "string" ? Number(m.odds) : m.odds,
      }))
    : null;

  const description =
    typeof b.description === "string" ? b.description.trim() : null;

  // premium-only
  const price =
    typeof b.price === "number"
      ? b.price
      : typeof b.price === "string"
      ? Number(b.price)
      : null;
  const booking_code =
    typeof b.booking_code === "string" && b.booking_code.trim().length > 0
      ? b.booking_code.trim()
      : null;

  // validations
  if (!tType) return bad("Select FREE or PREMIUM");
  if (!title) return bad("Title is required (min 3 chars)");
  if (!bookmaker) return bad("Select a bookmaker");
  if (confidence === null || confidence < 1 || confidence > 10)
    return bad("Confidence must be 1–10");
  if (total_odds === null || total_odds <= 1)
    return bad("Total odds must be greater than 1.00");
  if (!match_details || match_details.length === 0)
    return bad("Add at least one match");

  if (tType === "premium") {
    if (price === null || !Number.isFinite(price) || price <= 0)
      return bad("Price (in kobo) is required for premium");
    if (!booking_code) return bad("Booking code is required for premium");
  }

  const now = new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    tipster_id: userRow.id,
    type: tType,
    title,
    description,
    total_odds,
    bookmaker,
    confidence_level: confidence,
    match_details,
    booking_code: tType === "premium" ? booking_code : b.booking_code ?? null,
    status: "pending",
    posted_at: now,
    times_purchased: 0,
    is_active: true,
    // If you added a `price` column to tickets, keep the next line; otherwise remove it.
    price: tType === "premium" ? price : null,
  };

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .insert(insertPayload)
    .select("id")
    .maybeSingle();
  if (error) return bad(error.message, 500);

  // best-effort RPC (safe no-op if not present)
  await supabaseAdmin.rpc("noop").catch(() => {});

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
