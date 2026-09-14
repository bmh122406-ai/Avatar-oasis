import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const avatar = await prisma.avatar.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarImageUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!avatar) {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }

  await prisma.avatar.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({ avatar });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;
  const avatar = await prisma.avatar.findUnique({ where: { id } });
  if (!avatar) {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }
  if (avatar.creatorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await prisma.avatar.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
