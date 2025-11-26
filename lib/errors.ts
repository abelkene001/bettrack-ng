// lib/errors.ts
// Centralized error handling utilities

import { NextResponse } from "next/server";

export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication required") {
        super(message, 401, "UNAUTHENTICATED");
        this.name = "AuthenticationError";
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Access forbidden") {
        super(message, 403, "FORBIDDEN");
        this.name = "AuthorizationError";
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class ValidationError extends AppError {
    constructor(message: string = "Validation failed") {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

export class PaymentError extends AppError {
    constructor(message: string = "Payment processing failed") {
        super(message, 402, "PAYMENT_ERROR");
        this.name = "PaymentError";
    }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                ok: false,
                error: error.message,
                code: error.code,
            },
            { status: error.statusCode }
        );
    }

    // Unknown errors
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Unexpected error:", error);

    return NextResponse.json(
        {
            ok: false,
            error: message,
            code: "INTERNAL_ERROR",
        },
        { status: 500 }
    );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R | NextResponse> => {
        try {
            return await handler(...args);
        } catch (error) {
            return formatErrorResponse(error) as R;
        }
    };
}
