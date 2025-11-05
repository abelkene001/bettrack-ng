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
    return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 401 });
  }

  // 2) Verify cookie → grab telegram id + name
  let sess: { sub: string; name?: string; username?: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return NextResponse.json({ ok: false, error: "BAD_SESSION" }, { status: 401 });
  }

  const telegramId = String(sess.sub);
  const name = sess.name || "User";

  // 3) Upsert into public.users by telegram_id
  //    NOTE: If you already created the tables, ensure users(telegram_id) is UNIQUE.
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        telegram_id: telegramId,
        name,
      },
      { onConflict: "telegram_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.id,                 // uuid from DB
      telegram_id: data.telegram_id,
      name: data.name,
      subscription_tier: data.subscription_tier,
      subscription_expires_at: data.subscription_expires_at,
      created_at: data.created_at,
    },
  });
}
