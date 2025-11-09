// components/HeaderBar.tsx
"use client";

type HeaderBarProps = {
  titleLeft: string; // show Telegram name on Home
  onOpenMenu?: () => void; // open sidebar
  onBellClick?: () => void; // notifications (stub for now)
};

export default function HeaderBar({
  titleLeft,
  onOpenMenu,
  onBellClick,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0b0f10]/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          aria-label="Menu"
          onClick={onOpenMenu}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm"
        >
          ☰
        </button>

        <div className="text-base font-semibold truncate">{titleLeft}</div>

        <button
          aria-label="Notifications"
          onClick={onBellClick}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm"
        >
          🔔
        </button>
      </div>
    </header>
  );
}
