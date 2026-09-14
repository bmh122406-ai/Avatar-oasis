import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { avatar: true },
  });
  if (order && order.buyerId === user.id) {
    return NextResponse.json({ type: "avatar_purchase", order });
  }

  const slot = await prisma.featuredSlot.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { avatar: true },
  });
  if (slot && slot.purchasedById === user.id) {
    return NextResponse.json({ type: "featured_slot", slot });
  }

  return NextResponse.json({ error: "Order not found." }, { status: 404 });
}
