// app/api/tickets/mine/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

type Status = "all" | "pending" | "won" | "lost";
type Range = "7" | "30" | "all";
type Mode = "bettor" | "tipster";

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

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "bettor") as Mode;
  const status = (url.searchParams.get("status") || "all") as Status;
  const range = (url.searchParams.get("range") || "7") as Range;

  // current user
  const { data: userRow, error: uErr } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (uErr) return bad(uErr.message, 500);
  if (!userRow) return bad("USER_NOT_FOUND", 401);

  const filters: string[] = [];
  if (status !== "all") {
    filters.push(`status.eq.${status}`);
  }
  const since = getRangeStart(range);

  if (mode === "tipster") {
    // my posted tickets
    let q = supabaseAdmin
      .from("tickets")
      .select(
        `
        id, type, title, description, total_odds, bookmaker, confidence_level,
        match_details, booking_code, status, posted_at,
        tipster:tipster_id (
          display_name, profile_photo_url, is_verified
        )
      `
      )
      .eq("tipster_id", userRow.id)
      .order("posted_at", { ascending: false })
      .limit(100);

    if (status !== "all") q = q.eq("status", status);
    if (since) q = q.gte("posted_at", since);

    const { data, error } = await q;
    if (error) return bad(error.message, 500);
    return NextResponse.json({ ok: true, items: data ?? [] });
  }

  // bettor: my purchases joined with tickets
  let q = supabaseAdmin
    .from("purchases")
    .select(
      `
      ticket_id,
      purchased_at,
      tickets!inner (
        id, type, title, description, total_odds, bookmaker, confidence_level,
        match_details, booking_code, status, posted_at,
        tipster:tipster_id (
          display_name, profile_photo_url, is_verified
        )
      )
    `
    )
    .eq("buyer_id", userRow.id)
    .order("purchased_at", { ascending: false })
    .limit(100);

  if (status !== "all") q = q.eq("tickets.status", status);
  if (since) q = q.gte("purchased_at", since);

  const { data, error } = await q;
  if (error) return bad(error.message, 500);

  const items = (data ?? []).map((row: unknown) => {
    const r = row as {
      tickets: {
        id: string;
        type: "free" | "premium";
        title: string;
        description: string | null;
        total_odds: number | null;
        bookmaker:
          | null
          | "bet9ja"
          | "sportybet"
          | "1xbet"
          | "betking"
          | "other";
        confidence_level: number | null;
        match_details: unknown;
        booking_code: string | null;
        status: "pending" | "won" | "lost";
        posted_at: string;
        tipster: {
          display_name: string;
          profile_photo_url: string | null;
          is_verified: boolean;
        } | null;
      };
    };
    return r.tickets;
  });

  return NextResponse.json({ ok: true, items });
}
