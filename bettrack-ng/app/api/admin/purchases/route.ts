// app/api/admin/purchases/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isAdminTelegramId } from "../../../../lib/telegram";

export async function GET(req: Request) {
  const id = req.headers.get("x-telegram-id");
  if (!isAdminTelegramId(id)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id, ticket_id, buyer_id, payment_status, payment_reference, amount_paid")
    .order("purchased_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}
