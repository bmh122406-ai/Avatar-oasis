import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2026-08-26.dahlia",
});

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "15");

export function calculatePlatformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

export const FEATURED_SLOT_PRICE_CENTS = Number(
  process.env.FEATURED_SLOT_PRICE_CENTS ?? "1999"
);
export const FEATURED_SLOT_DURATION_DAYS = Number(
  process.env.FEATURED_SLOT_DURATION_DAYS ?? "7"
);
export const FEATURED_SLOT_MAX_ACTIVE = Number(
  process.env.FEATURED_SLOT_MAX_ACTIVE ?? "6"
);

export function stripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return "Stripe isn't configured with valid API keys yet. Add real test keys to .env to enable payments.";
  }
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }
  return "Something went wrong talking to Stripe.";
}
