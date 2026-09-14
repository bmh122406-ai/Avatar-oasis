import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { avatarCreateSchema } from "@/lib/validation";
import { savePublicImage, savePrivateAvatarFile, UploadValidationError } from "@/lib/storage";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");
  const platform = searchParams.get("platform");
  const sort = searchParams.get("sort") ?? "newest";
  const creatorId = searchParams.get("creatorId");
  const featuredOnly = searchParams.get("featured") === "true";

  const where: Prisma.AvatarWhereInput = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (category) where.category = category;
  if (platform) where.platform = platform;
  if (creatorId) where.creatorId = creatorId;
  if (featuredOnly) {
    where.isFeatured = true;
    where.featuredUntil = { gt: new Date() };
  }

  const orderBy: Prisma.AvatarOrderByWithRelationInput =
    sort === "price_asc"
      ? { priceCents: "asc" }
      : sort === "price_desc"
      ? { priceCents: "desc" }
      : sort === "popular"
      ? { downloadCount: "desc" }
      : { createdAt: "desc" };

  const avatars = await prisma.avatar.findMany({
    where,
    orderBy,
    take: 60,
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatarImageUrl: true },
      },
    },
  });

  return NextResponse.json({ avatars });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (!user.isCreator) {
    return NextResponse.json(
      { error: "Only creator accounts can upload avatars." },
      { status: 403 }
    );
  }

  const formData = await request.formData();

  let tags: string[] = [];
  try {
    tags = JSON.parse(String(formData.get("tags") ?? "[]"));
  } catch {
    tags = [];
  }

  const parsed = avatarCreateSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceCents: Number(formData.get("priceCents") ?? 0),
    category: String(formData.get("category") ?? ""),
    platform: String(formData.get("platform") ?? ""),
    tags,
    polycount: formData.get("polycount")
      ? Number(formData.get("polycount"))
      : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const thumbnail = formData.get("thumbnail");
  const avatarFile = formData.get("avatarFile");

  if (!(thumbnail instanceof File) || thumbnail.size === 0) {
    return NextResponse.json({ error: "A thumbnail image is required." }, { status: 400 });
  }
  if (!(avatarFile instanceof File) || avatarFile.size === 0) {
    return NextResponse.json({ error: "The avatar package file is required." }, { status: 400 });
  }

  const previewFiles = formData
    .getAll("previewImages")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 6);

  try {
    const thumbnailUrl = await savePublicImage(thumbnail, "avatars/thumbnails");
    const previewImages: string[] = [];
    for (const preview of previewFiles) {
      previewImages.push(await savePublicImage(preview, "avatars/previews"));
    }
    const { key, fileName, sizeBytes } = await savePrivateAvatarFile(
      avatarFile,
      "avatars"
    );

    const avatar = await prisma.avatar.create({
      data: {
        creatorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        category: parsed.data.category,
        platform: parsed.data.platform,
        tags: JSON.stringify(parsed.data.tags),
        polycount: parsed.data.polycount,
        thumbnailUrl,
        previewImages: JSON.stringify(previewImages),
        fileKey: key,
        fileName,
        fileSizeBytes: sizeBytes,
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({ avatar }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
