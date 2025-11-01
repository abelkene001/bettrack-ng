// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";

export const metadata: Metadata = {
  title: "BetTrack NG",
  description: "Tipster accountability & odds comparison for Nigerian bettors",
  // ⛔️ Do not put viewport or themeColor here on Next.js 15/16
};

// ✅ Move viewport + themeColor here
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0f10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TelegramProvider>
          <div className="mx-auto max-w-md p-4">{children}</div>
        </TelegramProvider>
      </body>
    </html>
  );
}
