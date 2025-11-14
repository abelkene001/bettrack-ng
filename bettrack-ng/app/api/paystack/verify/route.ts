// app/api/paystack/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type VerifyOk = {
  status: boolean;
  data: {
    status: "success" | "failed" | "abandoned";
    amount: number; // kobo
    reference: string;
    currency: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { reference: string };
    if (!body.reference) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ ok: false, error: "PAYSTACK_SECRET_KEY missing" }, { status: 500 });

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(body.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text }, { status: 500 });
    }

    const json = (await res.json()) as VerifyOk;
    if (!json.status || json.data.status !== "success") {
      return NextResponse.json({ ok: false, error: "Not successful" }, { status: 400 });
    }

    // mark purchase as completed if pending
    const { data: pur } = await supabaseAdmin
      .from("purchases")
      .select("id, ticket_id, buyer_id, payment_status")
      .eq("payment_reference", body.reference)
      .maybeSingle();
    if (!pur) return NextResponse.json({ ok: false, error: "Purchase not found" }, { status: 404 });
    if (pur.payment_status !== "completed") {
      const { error: upErr } = await supabaseAdmin.from("purchases").update({ payment_status: "completed" }).eq("id", pur.id);
      if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    // optional: send bot DM to buyer
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        const { data: buyer } = await supabaseAdmin.from("users").select("telegram_id").eq("id", pur.buyer_id).maybeSingle();
        if (buyer?.telegram_id) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              chat_id: buyer.telegram_id,
              text: `✅ Payment confirmed. Your ticket is unlocked.`,
            }),
          });
        }
      }
    } catch {
      // ignore notification failure in MLP
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
