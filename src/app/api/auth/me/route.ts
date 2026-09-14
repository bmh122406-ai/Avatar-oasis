import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { toPublicUser } from "@/lib/user";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
