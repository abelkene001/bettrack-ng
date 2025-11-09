// app/api/tickets/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "@/lib/session";

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = String(params.id ?? "");

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  // user is optional: public ticket view allowed
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
        currentUserId = u?.id ?? null;
      }
    } catch {
      // ignore session errors; treat as public
    }
  }

  // ... keep the rest of your existing logic unchanged ...

  // fetch ticket
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
  const t = rows?.[0];
  if (!t) return bad("NOT_FOUND", 404);

  // purchased?
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

  // apply premium visibility rules
  let match_details: unknown = t.match_details;
  let booking_code: string | null = t.booking_code;

  if (t.type === "premium" && !purchased) {
    match_details = null;
    booking_code = null;
  }

  return NextResponse.json({
    ok: true,
    ticket: {
      id: t.id as string,
      type: t.type as "free" | "premium",
      title: t.title as string,
      description: (t.description as string | null) ?? null,
      total_odds: (t.total_odds as number | null) ?? null,
      bookmaker: (t.bookmaker as Bookmaker | null) ?? null,
      confidence_level: (t.confidence_level as number | null) ?? null,
      status: t.status as Status,
      posted_at: t.posted_at as string,
      tipster:
        (t.tipster as {
          display_name: string;
          profile_photo_url: string | null;
          is_verified: boolean;
        } | null) ?? null,
      match_details:
        (match_details as
          | { home: string; away: string; pick: string; odds: number }[]
          | null) ?? null,
      booking_code,
      purchased,
    },
  });
}
