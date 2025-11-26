// lib/paystack.ts
// Paystack payment utilities

import { PaymentError } from "./errors";

/**
 * Convert Naira to Kobo (Paystack uses kobo)
 */
export function nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
    return Math.round(kobo / 100);
}

/**
 * Format amount as Nigerian Naira
 */
export function formatNGN(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Generate unique payment reference
 */
export function generatePaymentReference(prefix: string = "BT"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Verify Paystack transaction
 */
export async function verifyPaystackTransaction(
    reference: string
): Promise<{
    status: "success" | "failed" | "abandoned";
    amount: number; // in kobo
    currency: string;
    reference: string;
}> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        throw new PaymentError("Payment configuration error");
    }

    const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
            headers: {
                Authorization: `Bearer ${secret}`,
            },
        }
    );

    if (!response.ok) {
        const text = await response.text();
        throw new PaymentError(`Payment verification failed: ${text}`);
    }

    const json = await response.json();

    if (!json.status || !json.data) {
        throw new PaymentError("Invalid payment verification response");
    }

    return {
        status: json.data.status,
        amount: json.data.amount,
        currency: json.data.currency,
        reference: json.data.reference,
    };
}

/**
 * Initialize Paystack popup (client-side)
 */
export function initializePaystackPopup(config: {
    email: string;
    amount: number; // in kobo
    reference: string;
    onSuccess: () => void;
    onClose: () => void;
}): void {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!key) {
        throw new Error("Paystack public key not configured");
    }

    if (!window.PaystackPop) {
        throw new Error("Paystack script not loaded");
    }

    const popup = window.PaystackPop.setup({
        key,
        email: config.email,
        amount: config.amount,
        ref: config.reference,
        callback: config.onSuccess,
        onClose: config.onClose,
    });

    popup.openIframe();
}
