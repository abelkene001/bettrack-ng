// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";

export const metadata: Metadata = {
  title: "BetTrack NG",
  description: "Tipster accountability & odds comparison for Nigerian bettors",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
