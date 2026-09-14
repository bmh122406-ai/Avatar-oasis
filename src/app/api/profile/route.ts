import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validation";
import { savePublicImage, UploadValidationError } from "@/lib/storage";
import { toPublicUser } from "@/lib/user";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const formData = await request.formData();

  const parsed = profileUpdateSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    socialLinks: {
      twitter: String(formData.get("twitter") ?? ""),
      discord: String(formData.get("discord") ?? ""),
      website: String(formData.get("website") ?? ""),
      vrchat: String(formData.get("vrchat") ?? ""),
    },
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const avatarImage = formData.get("avatarImage");
  const bannerImage = formData.get("bannerImage");

  try {
    let avatarImageUrl = user.avatarImageUrl;
    let bannerImageUrl = user.bannerImageUrl;

    if (avatarImage instanceof File && avatarImage.size > 0) {
      avatarImageUrl = await savePublicImage(avatarImage, "profiles/avatars");
    }
    if (bannerImage instanceof File && bannerImage.size > 0) {
      bannerImageUrl = await savePublicImage(bannerImage, "profiles/banners");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: parsed.data.displayName,
        bio: parsed.data.bio,
        socialLinks: JSON.stringify(parsed.data.socialLinks),
        avatarImageUrl,
        bannerImageUrl,
      },
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
