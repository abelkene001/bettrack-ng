// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "BetTrack NG",
  description: "Buy & sell premium tickets for Nigerian bettors.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f10] text-white">{children}</body>
    </html>
  );
}
