import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FeaturedSlotPurchase } from "@/components/FeaturedSlotPurchase";
import { Badge } from "@/components/ui/Badge";
import { Star } from "lucide-react";

export default async function FeaturedSlotsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/featured");
  if (!user.isCreator) redirect("/dashboard");

  const [eligibleAvatars, activeFeatured] = await Promise.all([
    prisma.avatar.findMany({
      where: {
        creatorId: user.id,
        status: "PUBLISHED",
        OR: [{ isFeatured: false }, { featuredUntil: { lt: new Date() } }],
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.avatar.findMany({
      where: { isFeatured: true, featuredUntil: { gt: new Date() } },
      orderBy: { featuredUntil: "asc" },
      include: { creator: { select: { username: true, displayName: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Featured Slots</h1>
      <p className="mt-1 text-muted">
        Featured avatars appear at the top of the homepage. Slots are limited — buy one before they run out.
      </p>

      <div className="mt-6">
        <FeaturedSlotPurchase avatars={eligibleAvatars} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold">Currently featured</h2>
        {activeFeatured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No avatars are featured right now — be the first!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeFeatured.map((avatar) => (
              <div key={avatar.id} className="card-surface flex items-center gap-3 rounded-xl p-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-surface-2 shrink-0">
                  <Image src={avatar.thumbnailUrl} alt={avatar.title} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/avatars/${avatar.id}`} className="font-medium hover:underline line-clamp-1">
                    {avatar.title}
                  </Link>
                  <p className="text-xs text-muted">by @{avatar.creator.username}</p>
                </div>
                <Badge tone="accent" className="shrink-0">
                  <Star size={10} className="fill-current" /> until {avatar.featuredUntil?.toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
