import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { stripe, calculatePlatformFee, stripeErrorMessage } from "@/lib/stripe";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to purchase." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const avatarId = body?.avatarId;
  if (typeof avatarId !== "string") {
    return NextResponse.json({ error: "Missing avatarId." }, { status: 400 });
  }

  const avatar = await prisma.avatar.findUnique({
    where: { id: avatarId },
    include: { creator: true },
  });
  if (!avatar || avatar.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }
  if (avatar.creatorId === user.id) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
  }

  const alreadyOwned = await prisma.order.findFirst({
    where: { avatarId, buyerId: user.id, status: "COMPLETED" },
  });
  if (alreadyOwned) {
    return NextResponse.json({ error: "You already own this avatar." }, { status: 400 });
  }

  if (!avatar.creator.stripeOnboarded || !avatar.creator.stripeAccountId) {
    return NextResponse.json(
      { error: "This creator hasn't finished setting up payouts yet." },
      { status: 400 }
    );
  }

  const platformFeeCents = calculatePlatformFee(avatar.priceCents);
  const creatorPayoutCents = avatar.priceCents - platformFeeCents;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: avatar.priceCents,
            product_data: {
              name: avatar.title,
              description: `VRChat avatar by ${avatar.creator.displayName}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: avatar.creator.stripeAccountId },
      },
      metadata: {
        type: "avatar_purchase",
        avatarId: avatar.id,
        buyerId: user.id,
      },
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/avatars/${avatar.id}?checkout=cancelled`,
    });

    await prisma.order.create({
      data: {
        buyerId: user.id,
        avatarId: avatar.id,
        amountTotalCents: avatar.priceCents,
        platformFeeCents,
        creatorPayoutCents,
        stripeCheckoutSessionId: session.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 502 });
  }
}
