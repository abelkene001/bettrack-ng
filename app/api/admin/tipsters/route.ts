// app/api/admin/tipsters/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isAdminTelegramId } from "../../../../lib/telegram";

export async function GET(req: Request) {
  const id = req.headers.get("x-telegram-id");
  if (!isAdminTelegramId(id)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("tipster_profiles")
    .select("user_id, display_name, is_approved")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}
