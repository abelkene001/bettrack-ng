// components/TopTabs.tsx
"use client";

type Status = "all" | "pending" | "won" | "lost";
type Range = "7" | "30" | "all";

type TopTabsProps = {
  status: Status;
  onStatusChange: (s: Status) => void;
  range: Range;
  onRangeChange: (r: Range) => void;
  showTipsterSwitch?: boolean;
  mode: "bettor" | "tipster";
  onModeToggle?: (m: "bettor" | "tipster") => void;
};

export default function TopTabs({
  status,
  onStatusChange,
  range,
  onRangeChange,
  showTipsterSwitch = false,
  mode,
  onModeToggle,
}: TopTabsProps) {
  const statuses: Status[] = ["all", "pending", "won", "lost"];

  return (
    <div className="rounded-2xl bg-white/5 p-4 shadow-sm">
      {/* top row: status tabs */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {statuses.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-xl px-3 py-2 text-xs ${
                active
                  ? "bg-white text-[#0b0f10] font-semibold"
                  : "bg-white/10 text-white"
              }`}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>

      {/* bottom row: range + (optional) mode switch */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRangeChange("7")}
            className={`rounded-xl px-3 py-2 text-xs ${
              range === "7"
                ? "bg-white text-[#0b0f10] font-semibold"
                : "bg-white/10 text-white"
            }`}
          >
            Last 7d
          </button>
          <button
            onClick={() => onRangeChange("30")}
            className={`rounded-xl px-3 py-2 text-xs ${
              range === "30"
                ? "bg-white text-[#0b0f10] font-semibold"
                : "bg-white/10 text-white"
            }`}
          >
            Last 30d
          </button>
          <button
            onClick={() => onRangeChange("all")}
            className={`rounded-xl px-3 py-2 text-xs ${
              range === "all"
                ? "bg-white text-[#0b0f10] font-semibold"
                : "bg-white/10 text-white"
            }`}
          >
            All time
          </button>
        </div>

        {showTipsterSwitch && onModeToggle && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onModeToggle("bettor")}
              className={`rounded-xl px-3 py-2 text-xs ${
                mode === "bettor"
                  ? "bg-white text-[#0b0f10] font-semibold"
                  : "bg-white/10 text-white"
              }`}
            >
              My Purchases
            </button>
            <button
              onClick={() => onModeToggle("tipster")}
              className={`rounded-xl px-3 py-2 text-xs ${
                mode === "tipster"
                  ? "bg-white text-[#0b0f10] font-semibold"
                  : "bg-white/10 text-white"
              }`}
            >
              My Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
