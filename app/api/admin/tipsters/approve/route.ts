// app/api/admin/tipsters/approve/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { isAdminTelegramId } from "../../../../../lib/telegram";

export async function POST(req: Request) {
  const id = req.headers.get("x-telegram-id");
  if (!isAdminTelegramId(id)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { user_id: string };
  if (!body.user_id) return NextResponse.json({ ok: false, error: "Missing user_id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("tipster_profiles")
    .update({ is_approved: true })
    .eq("user_id", body.user_id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
