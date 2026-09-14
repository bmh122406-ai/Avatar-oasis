import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  stripe,
  stripeErrorMessage,
  FEATURED_SLOT_PRICE_CENTS,
  FEATURED_SLOT_DURATION_DAYS,
  FEATURED_SLOT_MAX_ACTIVE,
} from "@/lib/stripe";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const avatarId = body?.avatarId;
  if (typeof avatarId !== "string") {
    return NextResponse.json({ error: "Missing avatarId." }, { status: 400 });
  }

  const avatar = await prisma.avatar.findUnique({ where: { id: avatarId } });
  if (!avatar) {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }
  if (avatar.creatorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  if (avatar.isFeatured && avatar.featuredUntil && avatar.featuredUntil > new Date()) {
    return NextResponse.json({ error: "This avatar is already featured." }, { status: 400 });
  }

  const activeCount = await prisma.avatar.count({
    where: { isFeatured: true, featuredUntil: { gt: new Date() } },
  });
  if (activeCount >= FEATURED_SLOT_MAX_ACTIVE) {
    const soonest = await prisma.avatar.findFirst({
      where: { isFeatured: true, featuredUntil: { gt: new Date() } },
      orderBy: { featuredUntil: "asc" },
      select: { featuredUntil: true },
    });
    return NextResponse.json(
      {
        error: "All featured slots are currently taken.",
        nextAvailableAt: soonest?.featuredUntil ?? null,
      },
      { status: 409 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FEATURED_SLOT_PRICE_CENTS,
            product_data: {
              name: `Featured slot — ${avatar.title}`,
              description: `${FEATURED_SLOT_DURATION_DAYS} days of homepage placement`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "featured_slot",
        avatarId: avatar.id,
        purchasedById: user.id,
        durationDays: String(FEATURED_SLOT_DURATION_DAYS),
      },
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/featured?checkout=cancelled`,
    });

    await prisma.featuredSlot.create({
      data: {
        avatarId: avatar.id,
        purchasedById: user.id,
        amountPaidCents: FEATURED_SLOT_PRICE_CENTS,
        durationDays: FEATURED_SLOT_DURATION_DAYS,
        stripeCheckoutSessionId: session.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 502 });
  }
}
