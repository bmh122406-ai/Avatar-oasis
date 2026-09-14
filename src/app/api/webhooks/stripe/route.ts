import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// This is the single source of truth for "did the money actually arrive."
// Nothing elsewhere marks an Order/FeaturedSlot as paid — only a verified
// webhook event does, so a client can never spoof a completed purchase.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      if (type === "avatar_purchase") {
        await prisma.order.updateMany({
          where: { stripeCheckoutSessionId: session.id, status: "PENDING" },
          data: {
            status: "COMPLETED",
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        });
      } else if (type === "featured_slot") {
        const slot = await prisma.featuredSlot.findUnique({
          where: { stripeCheckoutSessionId: session.id },
        });
        if (slot && slot.status === "PENDING") {
          const startsAt = new Date();
          const endsAt = new Date(
            startsAt.getTime() + slot.durationDays * 24 * 60 * 60 * 1000
          );
          await prisma.featuredSlot.update({
            where: { id: slot.id },
            data: { status: "ACTIVE", startsAt, endsAt },
          });
          await prisma.avatar.update({
            where: { id: slot.avatarId },
            data: { isFeatured: true, featuredUntil: endsAt },
          });
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.order.updateMany({
        where: { stripeCheckoutSessionId: session.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
