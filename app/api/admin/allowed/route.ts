// app/api/admin/allowed/route.ts
import { NextResponse } from "next/server";
import { isAdminTelegramId } from "../../../../lib/telegram";

export async function GET(req: Request) {
  const header = req.headers.get("x-telegram-id");
  const ok = isAdminTelegramId(header);
  return NextResponse.json(ok ? { ok: true } : { ok: false, reason: "Not admin" }, { status: ok ? 200 : 403 });
}
