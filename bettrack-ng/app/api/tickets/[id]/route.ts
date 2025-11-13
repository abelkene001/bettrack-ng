// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
type Status = "pending" | "won" | "lost";
type TicketType = "free" | "premium";

type DBTicketRow = {
  id: string;
  tipster_id: string; // users.id (uuid)
  type: TicketType;
  title: string;
  description: string;
  price: number | null; // kobo for premium
  total_odds: number;
  bookmaker: Bookmaker;
  confidence_level: number;
  match_details: unknown; // jsonb
  booking_code: string | null;
  status: Status;
  posted_at: string;
  settled_at: string | null;
  times_purchased: number;
  is_active: boolean;
};

type TipsterProfileRow = {
  user_id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  average_rating: number | null;
  total_followers: number;
  is_verified: boolean;
};

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = String(ctx.params?.id ?? "");
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Missing id" },
      { status: 400 }
    );
  }

  const supabase = getAdmin();

  // 1) Fetch ticket
  const { data: ticket, error: tErr } = await supabase
    .from<DBTicketRow>("tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (tErr) {
    return NextResponse.json(
      { ok: false, message: tErr.message },
      { status: 500 }
    );
  }
  if (!ticket || !ticket.is_active) {
    return NextResponse.json(
      { ok: false, message: "Not found" },
      { status: 404 }
    );
  }

  // 2) Fetch tipster profile (by user_id)
  const { data: profile, error: pErr } = await supabase
    .from<TipsterProfileRow>("tipster_profiles")
    .select(
      "user_id, display_name, bio, profile_photo_url, average_rating, total_followers, is_verified"
    )
    .eq("user_id", ticket.tipster_id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json(
      { ok: false, message: pErr.message },
      { status: 500 }
    );
  }

  // Premium masking (until we implement purchase check)
  const isPremium = ticket.type === "premium";
  const maskedMatchDetails = isPremium ? [] : ticket.match_details ?? [];
  const maskedBooking = isPremium ? null : ticket.booking_code;

  return NextResponse.json({
    ok: true,
    ticket: {
      id: ticket.id,
      tipster_id: ticket.tipster_id,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      price: ticket.price, // still in kobo
      total_odds: ticket.total_odds,
      bookmaker: ticket.bookmaker,
      confidence_level: ticket.confidence_level,
      match_details: maskedMatchDetails,
      booking_code: maskedBooking,
      status: ticket.status,
      posted_at: ticket.posted_at,
      settled_at: ticket.settled_at,
      times_purchased: ticket.times_purchased,
    },
    tipster: profile
      ? {
          user_id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio ?? "",
          profile_photo_url: profile.profile_photo_url,
          average_rating: profile.average_rating ?? 0,
          total_followers: profile.total_followers,
          is_verified: profile.is_verified,
        }
      : null,
  });
}
