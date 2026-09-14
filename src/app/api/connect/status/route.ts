import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { stripe, stripeErrorMessage } from "@/lib/stripe";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!user.stripeAccountId) {
    return NextResponse.json({ connected: false, onboarded: false });
  }

  try {
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const onboarded = Boolean(account.details_submitted && account.charges_enabled);

    if (onboarded !== user.stripeOnboarded) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeOnboarded: onboarded },
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    return NextResponse.json(
      { connected: true, onboarded: false, error: stripeErrorMessage(error) },
      { status: 200 }
    );
  }
}
