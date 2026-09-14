import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { toPublicUser } from "@/lib/user";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { email, username, displayName, password, isCreator } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.email === email
            ? "An account with that email already exists."
            : "That username is taken.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash,
      isCreator,
      role: isCreator ? "CREATOR" : "BUYER",
    },
  });

  await createSession(user.id);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
