import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { stripe, stripeErrorMessage } from "@/lib/stripe";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (!user.isCreator) {
    return NextResponse.json(
      { error: "Only creator accounts can connect payouts." },
      { status: 403 }
    );
  }

  try {
    let accountId = user.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { userId: user.id },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/dashboard/payouts?refresh=1`,
      return_url: `${APP_URL}/dashboard/payouts?onboarded=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 502 });
  }
}
