// app/page.tsx
"use client";

import { useCallback } from "react";
import HomeHeader from "../components/HomeHeader";
import FeedCard, { type FeedItem } from "../components/FeedCard";
import SkeletonCard from "../components/SkeletonCard";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { hapticImpact } from "../lib/telegram";

async function fetchRecent(
  cursor: string | null
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  params.set("limit", "10");
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/tickets/recent?${params.toString()}`, {
    cache: "no-store",
  });
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    return { items: [], nextCursor: null };
  }
  const json = (await res.json()) as {
    ok: boolean;
    items?: FeedItem[];
    nextCursor?: string | null;
  };
  if (!json.ok) return { items: [], nextCursor: null };
  return { items: json.items ?? [], nextCursor: json.nextCursor ?? null };
}

export default function HomePage() {
  const { items, loading, hasMore, sentinelRef, loadedOnce } =
    useInfiniteScroll<FeedItem>({
      fetchPage: fetchRecent,
    });

  const openDrawer = useCallback(() => {
    // (future) open real drawer
    hapticImpact("light");
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0f10] text-white">
      <HomeHeader onOpenDrawer={openDrawer} />

      <div className="mx-auto max-w-md space-y-4 p-4 pb-24">
        {/* First load skeletons */}
        {!loadedOnce && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {items.map((it) => (
          <FeedCard key={it.id} item={it} />
        ))}

        {/* Sentinel for infinite scroll */}
        {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}

        {/* Empty state */}
        {loadedOnce && items.length === 0 && !loading && (
          <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-white/70">
            No tickets yet. Try again later or browse tipsters.
          </div>
        )}
      </div>
    </main>
  );
}
