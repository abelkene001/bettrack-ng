// app/api/me/sync/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

export async function GET() {
  // Read our app session cookie
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );
  }

  //Decode cookie -> telegram id + name
  let sess: { sub: string; name?: string; username?: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return NextResponse.json(
      { ok: false, error: "BAD_SESSION" },
      { status: 401 }
    );
  }

  //Find user by telegram_id
  const telegramId = Number(sess.sub);
  if (!Number.isFinite(telegramId)) {
    return NextResponse.json(
      { ok: false, error: "BAD_TELEGRAM_ID" },
      { status: 400 }
    );
  }

  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("user")
    .select("*")
    .eq("telegram_id")
    .maybeSingle();

  if (userErr) {
    return NextResponse.json(
      { ok: false, error: userErr.message },
      { status: 500 }
    );
  }
  if (!userRow) {
    // if user does not exist yet, create a minmal one
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
    // Fetch profile (if any)
    const { data: Profile, error: proErr } = await supabaseAdmin
      .from("tipster_profiles")
      .select("*")
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (proErr) {
      return NextResponse.json(
        { ok: false, error: proErr.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      user: userRow,
      profile: Profile ?? null,
    });
  }
}
