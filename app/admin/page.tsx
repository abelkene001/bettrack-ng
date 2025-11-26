// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

type TipsterRow = { user_id: string; display_name: string | null; is_approved: boolean };
type PurchaseRow = { id: string; ticket_id: string; buyer_id: string; payment_status: string; payment_reference: string; amount_paid: number };

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tipsters, setTipsters] = useState<TipsterRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const r = await fetch("/api/admin/allowed", { cache: "no-store" });
        const j = (await r.json()) as { ok: boolean; reason?: string };
        if (!cancelled) {
          if (j.ok) setAllowed(true);
          else {
            setAllowed(false);
            setErr(j.reason || "Not allowed");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setAllowed(false);
          setErr((e as Error).message);
        }
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (allowed !== true) return;
    let cancelled = false;
    async function load() {
      const t = await fetch("/api/admin/tipsters", { cache: "no-store" });
      const tj = (await t.json()) as { ok: boolean; items?: TipsterRow[]; error?: string };
      if (!cancelled && tj.ok && tj.items) setTipsters(tj.items);

      const p = await fetch("/api/admin/purchases", { cache: "no-store" });
      const pj = (await p.json()) as { ok: boolean; items?: PurchaseRow[]; error?: string };
      if (!cancelled && pj.ok && pj.items) setPurchases(pj.items);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  async function approve(userId: string) {
    try {
      const r = await fetch("/api/admin/tipsters/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Failed");
      setTipsters((old) => old.map((x) => (x.user_id === userId ? { ...x, is_approved: true } : x)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (allowed === null)
    return <main className="mx-auto min-h-screen max-w-md px-4 py-4">Loading…</main>;

  if (!allowed)
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-4">
        <div className="rounded-xl bg-red-500/15 p-3 text-red-200">Access denied: {err}</div>
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#0b0f10] px-4 py-4">
      <div className="mb-4 text-sm font-semibold">Admin</div>

      <div className="mb-6 rounded-3xl bg-[#1A171C] p-4">
        <div className="mb-3 font-semibold">Tipsters</div>
        <div className="space-y-2">
          {tipsters.map((t) => (
            <div key={t.user_id} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm">
              <div>{t.display_name ?? t.user_id}</div>
              {t.is_approved ? (
                <span className="text-xs text-green-400">Approved</span>
              ) : (
                <button onClick={() => approve(t.user_id)} className="rounded-lg bg-green-600 px-3 py-1 text-xs">
                  Approve
                </button>
              )}
            </div>
          ))}
          {tipsters.length === 0 && <div className="text-xs text-white/60">No tipsters yet.</div>}
        </div>
      </div>

      <div className="rounded-3xl bg-[#1A171C] p-4">
        <div className="mb-3 font-semibold">Recent Purchases</div>
        <div className="space-y-2">
          {purchases.map((p) => (
            <div key={p.id} className="rounded-xl bg-white/5 p-3 text-xs">
              <div>Ref: {p.payment_reference}</div>
              <div>Status: {p.payment_status}</div>
              <div>Amount: ₦{Math.round(p.amount_paid / 100)}</div>
            </div>
          ))}
          {purchases.length === 0 && <div className="text-xs text-white/60">No purchases yet.</div>}
        </div>
      </div>
    </main>
  );
}
