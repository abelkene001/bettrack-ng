// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import TelegramProvider from "../components/TelegramProvider";
import BottomTabs from "../components/BottomTabs";

export const metadata: Metadata = {
  title: "BetTrack NG",
  description: "Telegram Mini App marketplace for betting tickets",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f10] text-white pb-20">
        <TelegramProvider>
          <div className="mx-auto max-w-md px-4 pt-4 pb-4">{children}</div>
        </TelegramProvider>
        <BottomTabs />
      </body>
    </html>
  );
}
