// app/u/[id]/page.tsx
import Link from "next/link";
import Image from "next/image";
import TicketCard, {
  TicketCardModel,
  TipsterBrief,
  Bookmaker,
} from "../../../components/TicketCard";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type DBProfile = {
  display_name: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number | null;
  total_tickets_posted: number | null;
  total_tickets_sold: number | null;
  average_rating: number | string | null;
  is_verified: boolean | null;
};

type TipsterProfile = {
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_followers: number;
  total_tickets_posted: number;
  total_tickets_sold: number;
  average_rating: number | null;
  is_verified: boolean;
};

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
}

function toBookmaker(v: unknown): Bookmaker {
  if (
    v === "bet9ja" ||
    v === "sportybet" ||
    v === "1xbet" ||
    v === "betking" ||
    v === "other"
  )
    return v;
  return null;
}

function toStatus(v: unknown): "pending" | "won" | "lost" {
  if (v === "won" || v === "lost") return v;
  return "pending";
}

export default async function TipsterPage({
  params,
}: {
  // ✅ Your project’s PageProps expects params to be a Promise
  params: Promise<{ id: string }>;
}) {
  const { id: tipsterId } = await params;

  // 1) profile
  const { data: prof, error: pErr } = await supabaseAdmin
    .from("tipster_profiles")
    .select(
      "display_name, bio, profile_photo_url, total_followers, total_tickets_posted, total_tickets_sold, average_rating, is_verified"
    )
    .eq("user_id", tipsterId)
    .maybeSingle();

  if (pErr) {
    return (
      <div className="p-4 text-red-400">
        Failed to load profile: {pErr.message}
      </div>
    );
  }

  if (!prof) {
    return <div className="p-4">Tipster not found.</div>;
  }

  const p = prof as DBProfile;

  const profile: TipsterProfile = {
    display_name: String(p.display_name ?? "Tipster"),
    bio: p.bio ? String(p.bio) : null,
    profile_photo_url: p.profile_photo_url ? String(p.profile_photo_url) : null,
    total_followers: Number(p.total_followers ?? 0),
    total_tickets_posted: Number(p.total_tickets_posted ?? 0),
    total_tickets_sold: Number(p.total_tickets_sold ?? 0),
    average_rating:
      typeof p.average_rating === "number"
        ? p.average_rating
        : toNumberOrNull(p.average_rating),
    is_verified: Boolean(p.is_verified),
  };

  // 2) recent tickets
  const { data: tRows, error: tErr } = await supabaseAdmin
    .from("tickets")
    .select(
      "id, type, title, description, total_odds, bookmaker, confidence_level, match_details, booking_code, status, posted_at, price"
    )
    .eq("tipster_id", tipsterId)
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (tErr) {
    return (
      <div className="p-4 text-red-400">
        Failed to load tickets: {tErr.message}
      </div>
    );
  }

  const tipsterBrief: TipsterBrief = {
    display_name: profile.display_name,
    profile_photo_url: profile.profile_photo_url,
    is_verified: profile.is_verified,
  };

  const tickets: TicketCardModel[] = (tRows ?? []).map(
    (row: Record<string, unknown>): TicketCardModel => {
      const totalOdds = toNumberOrNull(row.total_odds);
      const conf = toNumberOrNull(row.confidence_level);
      return {
        id: String(row.id),
        type: (row.type as string) === "premium" ? "premium" : "free",
        title: String((row.title as string) ?? "Ticket"),
        description: (row.description as string) ?? null,
        total_odds: totalOdds,
        bookmaker: toBookmaker(row.bookmaker),
        confidence_level: conf,
        status: toStatus(row.status),
        posted_at:
          typeof row.posted_at === "string"
            ? row.posted_at
            : new Date().toISOString(),
        tipster: tipsterBrief,
        tipster_id: tipsterId,
        price:
          typeof row.price === "number" ? row.price : toNumberOrNull(row.price),
      };
    }
  );

  return (
    <main className="px-4 pb-20 pt-4 max-w-xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{profile.display_name}</div>
        <Link href="/" className="text-sm text-white/70 hover:text-white">
          Home
        </Link>
      </div>

      {/* Profile header */}
      <div className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          {profile.profile_photo_url ? (
            <Image
              src={profile.profile_photo_url}
              width={64}
              height={64}
              alt={profile.display_name}
              className="h-16 w-16 object-cover"
            />
          ) : (
            <div className="h-16 w-16 grid place-items-center text-base text-white/60">
              👤
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">
              {profile.display_name}
            </div>
            {profile.is_verified && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                ✔
              </span>
            )}
          </div>
          <div className="text-sm text-white/70">
            {profile.total_followers.toLocaleString()} followers •{" "}
            {profile.total_tickets_sold.toLocaleString()} sales
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio ? (
        <p className="mt-3 text-sm text-white/80">{profile.bio}</p>
      ) : null}

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Tickets
          </div>
          <div className="font-semibold">{profile.total_tickets_posted}</div>
        </div>
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Sold
          </div>
          <div className="font-semibold">{profile.total_tickets_sold}</div>
        </div>
        <div className="rounded-xl bg-white/3 ring-1 ring-white/10 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Rating
          </div>
          <div className="font-semibold">{profile.average_rating ?? "-"}</div>
        </div>
      </div>

      {/* Tickets list */}
      <div className="mt-6 space-y-3">
        {tickets.length === 0 ? (
          <div className="text-sm text-white/60">No tickets yet.</div>
        ) : (
          tickets.map((t) => (
            <Link key={t.id} href={`/t/${t.id}`}>
              <TicketCard t={t} />
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
