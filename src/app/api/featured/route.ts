import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FEATURED_SLOT_MAX_ACTIVE, FEATURED_SLOT_PRICE_CENTS, FEATURED_SLOT_DURATION_DAYS } from "@/lib/stripe";

export async function GET() {
  const activeCount = await prisma.avatar.count({
    where: { isFeatured: true, featuredUntil: { gt: new Date() } },
  });

  const soonest = await prisma.avatar.findFirst({
    where: { isFeatured: true, featuredUntil: { gt: new Date() } },
    orderBy: { featuredUntil: "asc" },
    select: { featuredUntil: true },
  });

  return NextResponse.json({
    activeCount,
    maxSlots: FEATURED_SLOT_MAX_ACTIVE,
    slotsAvailable: Math.max(0, FEATURED_SLOT_MAX_ACTIVE - activeCount),
    priceCents: FEATURED_SLOT_PRICE_CENTS,
    durationDays: FEATURED_SLOT_DURATION_DAYS,
    nextAvailableAt: soonest?.featuredUntil ?? null,
  });
}
