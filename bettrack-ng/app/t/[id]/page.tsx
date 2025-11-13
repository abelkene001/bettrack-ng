// app/t/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

type TicketResponse =
  | {
      ok: true;
      ticket: {
        id: string;
        type: TicketType;
        status: Status;
        postedAt: string; // ISO
        title: string;
        description: string | null;
        odds: number | null;
        bookmaker: Bookmaker | null;
        confidence: number;
        bookingCode: string | null; // free only
        priceNGN: number | null; // premium only
        tipster: {
          id: string;
          name: string;
          photo: string | null;
          verified: boolean;
        };
      };
    }
  | { ok: false; error: string };

function clsStatus(s: Status): string {
  if (s === "won") return "bg-green-500/20 text-green-300";
  if (s === "lost") return "bg-red-500/20 text-red-300";
  return "bg-yellow-500/20 text-yellow-300"; // pending
}

function formatDDMMYYHHmm(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function formatPriceNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TicketPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<
    Extract<TicketResponse, { ok: true }>["ticket"] | null
  >(null);

  const id = params.id;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setErr("Server returned non-JSON.");
          setLoading(false);
          return;
        }
        const json: TicketResponse = await res.json();
        if (!json.ok) {
          setErr(json.error);
          setLoading(false);
          return;
        }
        if (!cancelled) setData(json.ticket);
      } catch (e) {
        setErr((e as Error)?.message || "Failed to load ticket.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const headerRightLabel = useMemo(() => {
    if (!data) return "";
    if (data.type === "premium" && typeof data.priceNGN === "number") {
      return formatPriceNGN(data.priceNGN);
    }
    if (data.type === "free" && data.bookingCode) {
      return data.bookingCode;
    }
    return "";
  }, [data]);

  return (
    <main className="min-h-screen bg-[#0b0f10] text-white">
      {/* Simple top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-[#0b0f10] px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 hover:bg-white/10"
          aria-label="Back"
        >
          {/* Back chevron */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="text-sm font-semibold">Ticket</div>
        <div className="text-xs text-white/80">{headerRightLabel}</div>
      </header>

      <div className="mx-auto max-w-md space-y-4 p-4 pb-24">
        {loading && (
          <div className="rounded-3xl bg-white/5 p-4">
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="mb-2 h-4 w-56 animate-pulse rounded bg-white/10" />
            <div className="mb-2 h-3 w-32 animate-pulse rounded bg-white/10" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 animate-pulse rounded-xl bg-white/10" />
              <div className="h-10 animate-pulse rounded-xl bg-white/10" />
              <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        )}

        {!loading && err && (
          <div className="rounded-2xl bg-red-500/15 p-4 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && !err && data && (
          <article className="rounded-3xl bg-[#1A171C] p-4 shadow-sm">
            {/* Tipster row */}
            <div className="mb-3 flex items-center gap-3">
              <Link
                href={`/tipster/${data.tipster.id}`}
                className="h-10 w-10 overflow-hidden rounded-full bg-white/10"
                aria-label="Open tipster"
              >
                {data.tipster.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.tipster.photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
                    {data.tipster.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/tipster/${data.tipster.id}`}
                  className="truncate text-[13px] font-semibold hover:underline"
                  title={data.tipster.name}
                >
                  {data.tipster.name}
                </Link>
                <div className="text-[11px] text-white/60">
                  {formatDDMMYYHHmm(data.postedAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] ${clsStatus(
                    data.status
                  )}`}
                >
                  {data.status[0].toUpperCase() + data.status.slice(1)}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] ${
                    data.type === "premium"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {data.type === "premium" ? "Premium" : "Free"}
                </span>
              </div>
            </div>

            {/* Title / description */}
            <h1 className="mb-1 text-base font-semibold">{data.title}</h1>
            <p className="mb-3 text-[12px] text-white/70">
              {data.description ?? " "}
            </p>

            {/* Pills row */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
                <div className="text-[10px] uppercase text-white/60">Odds</div>
                <div className="font-semibold">{data.odds ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
                <div className="text-[10px] uppercase text-white/60">
                  Bookmaker
                </div>
                <div className="font-semibold">{data.bookmaker ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center text-[11px]">
                <div className="text-[10px] uppercase text-white/60">
                  Confidence
                </div>
                <div className="font-semibold">{data.confidence}</div>
              </div>
            </div>

            {/* Bottom action area */}
            {data.type === "premium" ? (
              <div className="rounded-2xl bg-white/5 p-3 text-center text-[12px]">
                <div className="mb-2 text-white/80">
                  Ticket is{" "}
                  <span className="font-semibold text-purple-300">locked</span>.
                </div>
                <div className="text-white/60">
                  Purchase to unlock full booking code and match details (coming
                  in purchase step).
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 p-3 text-center text-[12px]">
                <div className="mb-1 text-white/80">Booking Code</div>
                <div className="text-sm font-semibold tracking-wide">
                  {data.bookingCode ?? "—"}
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    </main>
  );
}
