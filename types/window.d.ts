import type { TelegramWebApp, PaystackPop } from "./index";

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
        PaystackPop?: PaystackPop;
    }
}
