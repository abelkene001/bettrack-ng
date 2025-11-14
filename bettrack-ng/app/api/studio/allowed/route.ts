// app/api/studio/allowed/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getTelegramIdFromHeaders } from "../../../../lib/telegram";

export async function GET(req: Request) {
  const telegramId = getTelegramIdFromHeaders(req);
  if (!telegramId) return NextResponse.json({ ok: false, reason: "Unauthenticated" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!user || user.role !== "tipster") {
    return NextResponse.json({ ok: false, reason: "Not a tipster" }, { status: 403 });
  }

  const { data: prof } = await supabaseAdmin
    .from("tipster_profiles")
    .select("is_approved")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof || !prof.is_approved) {
    return NextResponse.json({ ok: false, reason: "Not approved yet" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
