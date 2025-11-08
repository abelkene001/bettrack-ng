// app/api/me/sync/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

export async function GET() {
  // 1) Read our app session cookie
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  // 2) Verify cookie → grab telegram id + name
  let sess: { sub: string; name?: string; username?: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return NextResponse.json(
      { ok: false, error: "BAD_SESSION" },
      { status: 401 }
    );
  }

  // Make sure we have a valid numeric telegram id
  const telegramId = Number(sess.sub);
  if (!Number.isFinite(telegramId)) {
    return NextResponse.json(
      { ok: false, error: "BAD_TELEGRAM_ID" },
      { status: 400 }
    );
  }

  // 3) Find (or create) the user by telegram_id
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users") // ✅ plural
    .select("*")
    .eq("telegram_id", telegramId) // ✅ pass value as 2nd arg
    .maybeSingle();

  if (userErr) {
    return NextResponse.json(
      { ok: false, error: userErr.message },
      { status: 500 }
    );
  }

  let user = userRow;
  if (!user) {
    const { data: newUser, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        telegram_id: telegramId,
        username: sess.username ?? null,
        first_name: sess.name ?? null,
        role: "bettor",
      })
      .select("*")
      .single();
    if (insErr) {
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 500 }
      );
    }
    user = newUser;
  }

  // 4) Fetch tipster profile (if any)
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json(
      { ok: false, error: profErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user,
    profile: profile ?? null,
  });
}
