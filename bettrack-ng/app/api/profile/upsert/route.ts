// app/api/profile/upsert/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../lib/session";

export async function POST(req: Request) {
  // 1) Auth via our session cookie
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token)
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 }
    );

  let sess: { sub: string; name?: string; username?: string };
  try {
    sess = await verifyAppSession(token);
  } catch {
    return NextResponse.json(
      { ok: false, error: "BAD_SESSION" },
      { status: 401 }
    );
  }

  const telegramId = Number(sess.sub);
  if (!Number.isFinite(telegramId)) {
    return NextResponse.json(
      { ok: false, error: "BAD_TELEGRAM_ID" },
      { status: 400 }
    );
  }

  // 2) Parse input
  type UpsertProfileRequest = {
    display_name?: string;
    bio?: string;
    profile_photo_url?: string | null;
  };

  let body: UpsertProfileRequest = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const display_name: string = (body.display_name ?? "").toString().trim();
  const bio: string = (body.bio ?? "").toString().trim();
  const profile_photo_url: string | null = body.profile_photo_url
    ? body.profile_photo_url.toString().trim()
    : null;

  if (!display_name || display_name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "DISPLAY_NAME_TOO_SHORT" },
      { status: 400 }
    );
  }
  if (display_name.length > 60) {
    return NextResponse.json(
      { ok: false, error: "DISPLAY_NAME_TOO_LONG" },
      { status: 400 }
    );
  }
  if (bio.length > 500) {
    return NextResponse.json(
      { ok: false, error: "BIO_TOO_LONG" },
      { status: 400 }
    );
  }
  if (profile_photo_url && !/^https?:\/\//i.test(profile_photo_url)) {
    return NextResponse.json(
      { ok: false, error: "PHOTO_URL_INVALID" },
      { status: 400 }
    );
  }

  // 3) Ensure user exists
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (userErr)
    return NextResponse.json(
      { ok: false, error: userErr.message },
      { status: 500 }
    );

  let userId = userRow?.id;
  if (!userId) {
    const { data: newUser, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        telegram_id: telegramId,
        username: sess.username ?? null,
        first_name: sess.name ?? null,
        role: "both", // creating a profile implies tipster role
      })
      .select("*")
      .single();
    if (insErr)
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 500 }
      );
    userId = newUser.id;
  } else {
    // Upgrade role if needed
    if (userRow.role !== "tipster" && userRow.role !== "both") {
      await supabaseAdmin
        .from("users")
        .update({ role: "both" })
        .eq("id", userId);
    }
  }

  // 4) Upsert tipster profile
  const { data: existing, error: selErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr)
    return NextResponse.json(
      { ok: false, error: selErr.message },
      { status: 500 }
    );

  if (!existing) {
    const { data: created, error: cErr } = await supabaseAdmin
      .from("tipster_profiles")
      .insert({
        user_id: userId,
        display_name,
        bio: bio || null,
        profile_photo_url: profile_photo_url || null,
      })
      .select("*")
      .single();
    if (cErr)
      return NextResponse.json(
        { ok: false, error: cErr.message },
        { status: 500 }
      );
    return NextResponse.json({ ok: true, profile: created, created: true });
  } else {
    const { data: updated, error: uErr } = await supabaseAdmin
      .from("tipster_profiles")
      .update({
        display_name,
        bio: bio || null,
        profile_photo_url: profile_photo_url || null,
      })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (uErr)
      return NextResponse.json(
        { ok: false, error: uErr.message },
        { status: 500 }
      );
    return NextResponse.json({ ok: true, profile: updated, created: false });
  }
}
