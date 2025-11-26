// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "BetTrack NG - Premium Betting Tips",
  description:
    "Buy and sell premium betting tickets from verified tipsters in Nigeria",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Telegram WebApp Script */}
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
        {/* Paystack Script */}
        <script src="https://js.paystack.co/v1/inline.js" async />
      </head>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <div className="min-h-screen pb-20">
          {children}
        </div>
        <Navigation />
      </body>
    </html>
  );
}
