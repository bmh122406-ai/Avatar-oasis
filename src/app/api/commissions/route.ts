import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { commissionCreateSchema } from "@/lib/validation";
import { savePublicImage, UploadValidationError } from "@/lib/storage";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");
  const buyerId = searchParams.get("buyerId");
  const status = searchParams.get("status");
  const openOnly = searchParams.get("open") === "true";

  const where: Prisma.CommissionWhereInput = {};
  if (creatorId) where.creatorId = creatorId;
  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status as Prisma.CommissionWhereInput["status"];
  if (openOnly) where.status = "OPEN";

  const commissions = await prisma.commission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      buyer: { select: { id: true, username: true, displayName: true, avatarImageUrl: true } },
      creator: { select: { id: true, username: true, displayName: true, avatarImageUrl: true } },
    },
  });

  return NextResponse.json({ commissions });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const formData = await request.formData();

  const parsed = commissionCreateSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    avatarBase: String(formData.get("avatarBase") ?? ""),
    budgetMinCents: Number(formData.get("budgetMinCents") ?? 0),
    budgetMaxCents: Number(formData.get("budgetMaxCents") ?? 0),
    deadline: String(formData.get("deadline") ?? ""),
    creatorUsername: String(formData.get("creatorUsername") ?? ""),
    contactNote: String(formData.get("contactNote") ?? ""),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  let targetCreatorId: string | null = null;
  if (parsed.data.creatorUsername) {
    const targetCreator = await prisma.user.findUnique({
      where: { username: parsed.data.creatorUsername },
      select: { id: true, isCreator: true },
    });
    if (!targetCreator || !targetCreator.isCreator) {
      return NextResponse.json({ error: "That creator couldn't be found." }, { status: 400 });
    }
    targetCreatorId = targetCreator.id;
  }

  const referenceFileEntries = formData
    .getAll("referenceFiles")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 5);

  try {
    const referenceFiles: string[] = [];
    for (const file of referenceFileEntries) {
      referenceFiles.push(await savePublicImage(file, "commissions/references"));
    }

    const commission = await prisma.commission.create({
      data: {
        buyerId: user.id,
        creatorId: targetCreatorId,
        title: parsed.data.title,
        description: parsed.data.description,
        avatarBase: parsed.data.avatarBase ?? "",
        budgetMinCents: parsed.data.budgetMinCents,
        budgetMaxCents: parsed.data.budgetMaxCents,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        contactNote: parsed.data.contactNote ?? "",
        referenceFiles: JSON.stringify(referenceFiles),
      },
    });

    return NextResponse.json({ commission }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
