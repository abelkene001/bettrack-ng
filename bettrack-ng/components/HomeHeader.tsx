// components/HomeHeader.tsx
"use client";

import { useRouter } from "next/navigation";

type Props = {
  onOpenDrawer: () => void;
};

export default function HomeHeader({ onOpenDrawer }: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-[#0b0f10] px-4 py-3">
      {/* Left: Drawer icon (replace with your exact SVG later) */}
      <button
        aria-label="Open menu"
        onClick={onOpenDrawer}
        className="rounded-xl p-2 hover:bg-white/10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="2" rx="1" fill="white" />
          <rect x="3" y="11" width="12" height="2" rx="1" fill="white" />
          <rect x="3" y="17" width="18" height="2" rx="1" fill="white" />
        </svg>
      </button>

      {/* Center: Title */}
      <div className="text-sm font-semibold text-white">Home</div>

      {/* Right: Bell → /notifications */}
      <button
        aria-label="Notifications"
        onClick={() => router.push("/notifications")}
        className="rounded-xl p-2 hover:bg-white/10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM20 17h-1V11a7 7 0 1 0-14 0v6H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2Z"
            fill="white"
          />
        </svg>
      </button>
    </header>
  );
}
