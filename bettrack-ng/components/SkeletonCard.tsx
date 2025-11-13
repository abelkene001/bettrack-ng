// components/SkeletonCard.tsx
export default function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white/5 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="mb-2 h-3 w-36 animate-pulse rounded bg-white/10" />
          <div className="h-2 w-28 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="mb-2 h-4 w-56 animate-pulse rounded bg-white/10" />
      <div className="mb-4 h-3 w-40 animate-pulse rounded bg-white/10" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="h-8 animate-pulse rounded-xl bg-white/10" />
        <div className="h-8 animate-pulse rounded-xl bg-white/10" />
        <div className="h-8 animate-pulse rounded-xl bg-white/10" />
      </div>

      <div className="h-10 animate-pulse rounded-2xl bg-white/10" />
    </div>
  );
}
