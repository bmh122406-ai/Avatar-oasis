import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { CommissionStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const CREATOR_TRANSITIONS: CommissionStatus[] = [
  "IN_PROGRESS",
  "DELIVERED",
  "DECLINED",
];

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;
  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const nextStatus = body?.status as CommissionStatus | undefined;
  if (!nextStatus) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 });
  }

  const isBuyer = commission.buyerId === user.id;
  const isAssignedCreator = commission.creatorId === user.id;
  const isUnclaimed = commission.creatorId === null && commission.status === "OPEN";

  // Any creator account can claim an open, unassigned commission request.
  if (isUnclaimed && nextStatus === "ACCEPTED" && user.isCreator) {
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "ACCEPTED", creatorId: user.id },
    });
    return NextResponse.json({ commission: updated });
  }

  if (isBuyer && nextStatus === "CANCELLED" && commission.status !== "COMPLETED") {
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ commission: updated });
  }

  // The buyer confirms delivered work, closing out the commission.
  if (isBuyer && nextStatus === "COMPLETED" && commission.status === "DELIVERED") {
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    return NextResponse.json({ commission: updated });
  }

  if (isAssignedCreator && CREATOR_TRANSITIONS.includes(nextStatus)) {
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: nextStatus },
    });
    return NextResponse.json({ commission: updated });
  }

  if (user.role === "ADMIN") {
    const updated = await prisma.commission.update({
      where: { id },
      data: { status: nextStatus },
    });
    return NextResponse.json({ commission: updated });
  }

  return NextResponse.json({ error: "That transition isn't allowed." }, { status: 400 });
}
