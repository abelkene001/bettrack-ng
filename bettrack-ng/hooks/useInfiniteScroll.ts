// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useState } from "react";

export function useInfiniteScroll<T>(opts: {
  fetchPage: (
    cursor: string | null
  ) => Promise<{ items: T[]; nextCursor: string | null }>;
  initialCursor?: string | null;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(
    opts.initialCursor ?? null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadedOnceRef = useRef<boolean>(false);

  const load = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const { items: page, nextCursor } = await opts.fetchPage(cursor);
      setItems((prev) => [...prev, ...page]);
      setCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
    } finally {
      setLoading(false);
      loadedOnceRef.current = true;
    }
  };

  useEffect(() => {
    // load first page
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) void load();
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current]);

  return {
    items,
    loading,
    hasMore,
    sentinelRef,
    loadedOnce: loadedOnceRef.current,
  };
}
