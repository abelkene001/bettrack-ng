// app/api/tickets/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

type TicketRow = {
  id: string;
  tipster_id: string;
  type: TicketType;
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: Bookmaker | null;
  confidence_level: number;
  booking_code: string | null;
  match_details: unknown | null;
  price: number | null; // kobo for premium
  posted_at: string; // ISO
  status: Status;
  settled_at: string | null;
};

type TipsterProfileRow = {
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  is_verified: boolean | null;
};

type OkBody = {
  ok: true;
  ticket: {
    id: string;
    type: TicketType;
    status: Status;
    postedAt: string;
    title: string;
    description: string | null;
    odds: number | null;
    bookmaker: Bookmaker | null;
    confidence: number;
    bookingCode: string | null; // hidden for premium here
    priceNGN: number | null; // for premium
    tipster: {
      id: string;
      name: string;
      photo: string | null;
      verified: boolean;
    };
  };
};

type ErrBody = { ok: false; error: string };

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error } as ErrBody, { status });
}

/**
 * ✅ Use a single-argument handler (Request) to avoid Next's analyzer rejecting the 2nd arg type.
 * We parse the id from the URL pathname instead of using `{ params }`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expecting: ["api", "tickets", "{id}"]
  const id = segments.length >= 3 ? segments[2] : "";
  if (!id) return bad("Missing ticket id", 400);

  // 1) Load ticket
  const { data: t, error: tErr } = await supabaseAdmin
    .from("tickets")
    .select(
      "id, tipster_id, type, title, description, total_odds, bookmaker, confidence_level, booking_code, match_details, price, posted_at, status, settled_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (tErr) return bad(tErr.message, 500);
  if (!t) return bad("Ticket not found", 404);

  const ticket = t as TicketRow;

  // 2) Tipster profile
  const { data: prof, error: pErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select("user_id, display_name, profile_photo_url, is_verified")
    .eq("user_id", ticket.tipster_id)
    .maybeSingle();

  if (pErr) return bad(pErr.message, 500);

  const profile = (prof ?? {
    user_id: ticket.tipster_id,
    display_name: "Tipster",
    profile_photo_url: null,
    is_verified: false,
  }) as TipsterProfileRow;

  // 3) Shape response (keep premium code locked at API level)
  const body: OkBody = {
    ok: true,
    ticket: {
      id: ticket.id,
      type: ticket.type,
      status: ticket.status,
      postedAt: ticket.posted_at,
      title: ticket.title,
      description: ticket.description,
      odds: typeof ticket.total_odds === "number" ? ticket.total_odds : null,
      bookmaker: ticket.bookmaker,
      confidence: ticket.confidence_level,
      bookingCode: ticket.type === "free" ? ticket.booking_code : null,
      priceNGN:
        ticket.type === "premium" && typeof ticket.price === "number"
          ? Math.round(ticket.price / 100)
          : null,
      tipster: {
        id: profile.user_id,
        name: profile.display_name ?? "Tipster",
        photo: profile.profile_photo_url,
        verified: Boolean(profile.is_verified),
      },
    },
  };

  return NextResponse.json(body);
}
