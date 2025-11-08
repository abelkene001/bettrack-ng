// app/api/tickets/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

type Payload = {
  type: "free";
  title: string;
  description: string | null;
  bookmaker: "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
  total_odds: number | null;
  confidence_level: number | null; // 1..10
  match_details: unknown;
  booking_code: string | null;
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return bad("NO_SESSION", 401);

  let sess: { sub: string; name?: string; username?: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return bad("BAD_SESSION", 401);
  }

  const telegramId = Number(sess.sub);
  if (!Number.isFinite(telegramId)) return bad("BAD_TELEGRAM_ID");

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return bad("BAD_JSON");
  }

  // validate
  if (body.type !== "free") return bad("ONLY_FREE_ALLOWED_FOR_NOW");
  const title = (body.title || "").trim();
  if (!title || title.length < 3) return bad("TITLE_TOO_SHORT");
  if (
    !["bet9ja", "sportybet", "1xbet", "betking", "other"].includes(
      body.bookmaker
    )
  )
    return bad("BAD_BOOKMAKER");
  const total_odds = body.total_odds !== null ? Number(body.total_odds) : null;
  const confidence =
    body.confidence_level !== null ? Number(body.confidence_level) : null;
  if (confidence !== null && (confidence < 1 || confidence > 10))
    return bad("BAD_CONFIDENCE");

  // find user + profile
  const { data: userRow, error: uErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (uErr) return bad(uErr.message, 500);
  if (!userRow) return bad("USER_NOT_FOUND", 401);

  const { data: prof, error: pErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select("*")
    .eq("user_id", userRow.id)
    .maybeSingle();
  if (pErr) return bad(pErr.message, 500);
  if (!prof) return bad("NO_TIPSTER_PROFILE"); // must create profile first

  // insert ticket
  const { data: created, error: cErr } = await supabaseAdmin
    .from("tickets")
    .insert({
      tipster_id: userRow.id,
      type: "free",
      title,
      description: body.description?.trim() || null,
      price: null,
      total_odds,
      bookmaker: body.bookmaker,
      confidence_level: confidence,
      match_details: body.match_details ?? [],
      booking_code: body.booking_code?.trim() || null,
      status: "pending",
      posted_at: new Date().toISOString(),
      is_active: true,
    })
    .select("id")
    .single();

  if (cErr) return bad(cErr.message, 500);

  // increment tipster counter (not critical if it fails)
  await supabaseAdmin.rpc("noop").catch(() => {}); // placeholder if you add RPC later
  await supabaseAdmin
    .from("tipster_profiles")
    .update({ total_tickets_posted: (prof.total_tickets_posted || 0) + 1 })
    .eq("id", prof.id);

  return NextResponse.json({ ok: true, id: created.id });
}
