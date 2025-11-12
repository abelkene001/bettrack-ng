// app/u/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TicketCard, { TicketCardModel } from "../../../components/TicketCard";

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

type ApiTicket = {
  id: string;
  type: "free" | "premium";
  title: string;
  description: string | null;
  total_odds: number | null;
  bookmaker: "bet9ja" | "sportybet" | "1xbet" | "betking" | "other" | null;
  confidence_level: number | null;
  match_details: unknown;
  booking_code: string | null;
  status: "pending" | "won" | "lost";
  posted_at: string;
};

export default function PublicTipsterPage() {
  const params = useParams();
  const router = useRouter();
  const tipsterId = String(params?.id ?? "");

  const [profile, setProfile] = useState<TipsterProfile | null>(null);
  const [tickets, setTickets] = useState<TicketCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!tipsterId) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/tipsters/${tipsterId}/summary`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "failed");

        const prof: TipsterProfile = json.profile as TipsterProfile;
        setProfile(prof);

        const list: ApiTicket[] = (json.tickets ?? []) as ApiTicket[];
        const mapped: TicketCardModel[] = list.map((t) => ({
          ...t,
          tipster_id: tipsterId,
          tipster: {
            display_name: prof.display_name,
            profile_photo_url: prof.profile_photo_url,
            is_verified: prof.is_verified,
          },
        }));
        setTickets(mapped);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [tipsterId]);

  if (loading) {
    return (
      <main className="p-4 pb-20">
        <div className="animate-pulse space-y-3">
          <div className="h-20 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
      </main>
    );
  }

  if (err || !profile) {
    return (
      <main className="p-4 pb-20">
        <div className="rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
          {err || "Not found"}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4 pb-20">
      <header className="rounded-2xl bg-white/5 p-4">
        <div className="flex items-center gap-4">
          {profile.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_photo_url}
              alt="avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-white/10" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold truncate">
                {profile.display_name}
              </div>
              {profile.is_verified && (
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                  Verified
                </span>
              )}
            </div>
            {profile.bio && (
              <div className="mt-1 text-sm text-white/80">{profile.bio}</div>
            )}
            <div className="mt-2 flex gap-4 text-xs">
              <div>
                <span className="font-semibold">
                  {profile.total_tickets_posted}
                </span>{" "}
                posts
              </div>
              <div>
                <span className="font-semibold">{profile.total_followers}</span>{" "}
                followers
              </div>
              <div>
                <span className="font-semibold">
                  {profile.total_tickets_sold}
                </span>{" "}
                sold
              </div>
              {typeof profile.average_rating === "number" && (
                <div>★ {profile.average_rating.toFixed(1)}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        {tickets.map((t) => (
          <TicketCard
            key={t.id}
            t={t}
            onOpenTicket={(id) => router.push(`/t/${id}`)}
            onOpenTipster={(uid) => router.push(`/u/${uid}`)}
          />
        ))}
        {!tickets.length && (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
            No tickets yet.
          </div>
        )}
      </section>
    </main>
  );
}
