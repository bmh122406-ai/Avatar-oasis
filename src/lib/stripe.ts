import "server-only";
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

// Lazily constructed so importing this module never throws just because an
// env var isn't set yet — that would crash `next build`'s page-data
// collection step (which imports every route) even on routes nobody visits.
// The error only surfaces when a request actually tries to call Stripe.
function getStripe(): Stripe {
  if (!stripeSingleton) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it in your environment (.env locally, or your host's project settings)."
      );
    }
    stripeSingleton = new Stripe(secretKey, {
      apiVersion: "2026-08-26.dahlia",
    });
  }
  return stripeSingleton;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
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
  if (error instanceof Error && error.message.startsWith("STRIPE_SECRET_KEY is not set")) {
    return "Stripe isn't configured yet. Add STRIPE_SECRET_KEY in your environment to enable payments.";
  }
  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return "Stripe isn't configured with valid API keys yet. Add real test keys to enable payments.";
  }
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }
  return "Something went wrong talking to Stripe.";
}
