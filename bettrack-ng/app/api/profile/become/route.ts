// app/api/profile/become/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function POST() {
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

  // find user
  const { data: userRow, error: uErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (uErr) return bad(uErr.message, 500);
  if (!userRow) return bad("USER_NOT_FOUND", 401);

  // set role to tipster (if you want "both" later, change here)
  const { error: roleErr } = await supabaseAdmin
    .from("users")
    .update({ role: "tipster" })
    .eq("id", userRow.id);
  if (roleErr) return bad(roleErr.message, 500);

  // ensure tipster profile exists
  const { data: prof, error: pErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select("id")
    .eq("user_id", userRow.id)
    .maybeSingle();
  if (pErr) return bad(pErr.message, 500);

  if (!prof) {
    const { error: cErr } = await supabaseAdmin
      .from("tipster_profiles")
      .insert({
        user_id: userRow.id,
        display_name: "", // user will fill
        bio: null,
        profile_photo_url: null,
        total_followers: 0,
        total_tickets_posted: 0,
        total_tickets_sold: 0,
        average_rating: null,
        is_verified: false,
        created_at: new Date().toISOString(),
      });
    if (cErr) return bad(cErr.message, 500);
  }

  return NextResponse.json({ ok: true });
}
