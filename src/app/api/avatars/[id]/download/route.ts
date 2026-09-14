import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { readPrivateFile, privateFileExists } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

// Secure download gateway: only the creator, or a buyer with a COMPLETED order,
// may ever retrieve the underlying file. The file itself lives outside /public.
export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;
  const avatar = await prisma.avatar.findUnique({ where: { id } });
  if (!avatar) {
    return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
  }

  const isOwner = avatar.creatorId === user.id;
  let hasPurchased = isOwner;

  if (!hasPurchased) {
    const order = await prisma.order.findFirst({
      where: { avatarId: id, buyerId: user.id, status: "COMPLETED" },
    });
    hasPurchased = Boolean(order);
  }

  if (!hasPurchased) {
    return NextResponse.json(
      { error: "Purchase this avatar to download it." },
      { status: 403 }
    );
  }

  const exists = await privateFileExists(avatar.fileKey);
  if (!exists) {
    return NextResponse.json({ error: "File is missing on the server." }, { status: 410 });
  }

  const buffer = await readPrivateFile(avatar.fileKey);

  if (!isOwner) {
    await prisma.avatar.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(avatar.fileName)}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
