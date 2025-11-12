// app/api/tickets/[id]/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { SESSION_COOKIE, verifyAppSession } from "../../../../../lib/session";

type Status = "pending" | "won" | "lost";

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop() || "";
  if (!id) return bad("MISSING_ID", 400);

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

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (!me?.id) return bad("USER_NOT_FOUND", 401);

  // verify ownership
  const { data: t, error: tErr } = await supabaseAdmin
    .from("tickets")
    .select("id, tipster_id")
    .eq("id", id)
    .maybeSingle();
  if (tErr) return bad(tErr.message, 500);
  if (!t) return bad("NOT_FOUND", 404);
  if (t.tipster_id !== me.id) return bad("NOT_OWNER", 403);

  // parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("INVALID_JSON");
  }
  const b = body as Record<string, unknown>;
  const status =
    b.status === "won" || b.status === "lost"
      ? (b.status as Status)
      : b.status === "pending"
      ? "pending"
      : null;
  if (!status) return bad("status must be one of pending|won|lost");

  const patch: Record<string, unknown> = {
    status,
    settled_at: status === "pending" ? null : new Date().toISOString(),
  };

  const { error: uErr } = await supabaseAdmin
    .from("tickets")
    .update(patch)
    .eq("id", id);
  if (uErr) return bad(uErr.message, 500);

  return NextResponse.json({ ok: true });
}
