// types/index.ts
// Centralized TypeScript type definitions

// ============================================================================
// Database Types
// ============================================================================

export type UserRole = "user" | "tipster" | "admin";

export interface User {
    id: string;
    telegram_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    role: UserRole;
    created_at: string;
}

export interface TipsterProfile {
    user_id: string;
    display_name: string;
    profile_photo_url: string | null;
    bio: string | null;
    is_approved: boolean;
    is_verified: boolean;
    total_tickets: number;
    success_rate: number | null;
    created_at: string;
}

export type Bookmaker = "bet9ja" | "sportybet" | "1xbet" | "betking" | "other";
export type TicketType = "free" | "premium";
export type TicketStatus = "pending" | "won" | "lost" | "void";

export interface Ticket {
    id: string;
    tipster_id: string;
    type: TicketType;
    title: string;
    description: string | null;
    total_odds: number;
    bookmaker: Bookmaker;
    confidence_level: number;
    price: number; // in kobo
    booking_code: string;
    status: TicketStatus;
    posted_at: string;
    match_details: any | null;
}

export type PaymentMethod = "paystack" | "flutterwave";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Purchase {
    id: string;
    ticket_id: string;
    buyer_id: string;
    payment_method: PaymentMethod;
    payment_reference: string;
    payment_status: PaymentStatus;
    amount_paid: number; // in kobo
    created_at: string;
    completed_at: string | null;
}

export interface Rating {
    id: string;
    ticket_id: string;
    user_id: string;
    rating: number; // 1-5
    comment: string | null;
    created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export type ApiResponse<T = any> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export interface TicketCardData {
    id: string;
    tipster: {
        id: string;
        name: string;
        photo: string | null;
        verified: boolean;
    };
    postedAt: string;
    title: string;
    description: string | null;
    odds: number;
    bookmaker: Bookmaker;
    confidence: number;
    priceNGN: number;
}

export interface TicketDetailData extends TicketCardData {
    bookingCode: string | null;
    status: TicketStatus;
    isPurchased: boolean;
}

export interface TipsterListItem {
    user_id: string;
    display_name: string;
    profile_photo_url: string | null;
    is_approved: boolean;
    is_verified: boolean;
    total_tickets: number;
    success_rate: number | null;
}

export interface PurchaseHistoryItem {
    id: string;
    ticket: {
        id: string;
        title: string;
        odds: number;
        status: TicketStatus;
    };
    amount_paid: number;
    payment_status: PaymentStatus;
    created_at: string;
}

// ============================================================================
// Telegram Types
// ============================================================================

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramWebAppInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
}

export type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotificationType = "error" | "success" | "warning";

export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: TelegramWebAppInitData;
    version: string;
    platform: string;
    colorScheme: "light" | "dark";
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    BackButton: {
        isVisible: boolean;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
        show(): void;
        hide(): void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText(text: string): void;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
        show(): void;
        hide(): void;
        enable(): void;
        disable(): void;
        showProgress(leaveActive?: boolean): void;
        hideProgress(): void;
        setParams(params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
        }): void;
    };
    HapticFeedback: {
        impactOccurred(style: HapticImpactStyle): void;
        notificationOccurred(type: HapticNotificationType): void;
        selectionChanged(): void;
    };
    ready(): void;
    expand(): void;
    close(): void;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

// ============================================================================
// Paystack Types
// ============================================================================

export interface PaystackConfig {
    key: string;
    email: string;
    amount: number; // in kobo
    ref: string;
    callback: (response: PaystackResponse) => void;
    onClose: () => void;
}

export interface PaystackResponse {
    reference: string;
    status: string;
    message: string;
    trans: string;
    transaction: string;
    trxref: string;
}

export interface PaystackPop {
    setup(config: PaystackConfig): {
        openIframe(): void;
    };
}

declare global {
    interface Window {
        PaystackPop?: PaystackPop;
    }
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreateTicketForm {
    title: string;
    description: string;
    total_odds: number;
    bookmaker: Bookmaker;
    confidence: number;
    priceNGN: number;
    booking_code: string;
}

export interface CreatePurchaseRequest {
    ticket_id: string;
    method: PaymentMethod;
}

export interface CreatePurchaseResponse {
    ok: true;
    reference: string;
    amount_kobo: number;
    email: string;
}

export interface VerifyPaymentRequest {
    reference: string;
}
