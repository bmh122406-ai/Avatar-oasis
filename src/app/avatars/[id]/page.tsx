import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PurchasePanel } from "@/components/PurchasePanel";
import { Button } from "@/components/ui/Button";
import { Star, Download, Eye } from "lucide-react";

export default async function AvatarDetailPage({
  params,
}: PageProps<"/avatars/[id]">) {
  const { id } = await params;

  const avatar = await prisma.avatar.findUnique({
    where: { id },
    include: { creator: true },
  });

  if (!avatar || avatar.status !== "PUBLISHED") notFound();

  const user = await getCurrentUser();
  const isOwnListing = user?.id === avatar.creatorId;
  const alreadyOwned = user
    ? Boolean(
        await prisma.order.findFirst({
          where: { avatarId: id, buyerId: user.id, status: "COMPLETED" },
        })
      )
    : false;

  const tags: string[] = JSON.parse(avatar.tags || "[]");
  const previewImages: string[] = JSON.parse(avatar.previewImages || "[]");
  const gallery = [avatar.thumbnailUrl, ...previewImages];
  const isCurrentlyFeatured =
    avatar.isFeatured && avatar.featuredUntil && avatar.featuredUntil > new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface-2">
            <Image src={gallery[0]} alt={avatar.title} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" priority />
            {isCurrentlyFeatured && (
              <Badge tone="accent" className="absolute left-3 top-3">
                <Star size={12} className="fill-current" /> Featured
              </Badge>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {gallery.slice(1).map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-2">
                  <Image src={src} alt={`${avatar.title} preview ${i + 1}`} fill sizes="150px" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {avatar.description}
            </p>
          </div>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-6 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Eye size={14} /> {avatar.viewCount} views
            </span>
            <span className="flex items-center gap-1.5">
              <Download size={14} /> {avatar.downloadCount} downloads
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-surface sticky top-20 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold">{avatar.title}</h1>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="accent">{avatar.category}</Badge>
              <Badge>{avatar.platform}</Badge>
              {avatar.polycount && <Badge>{avatar.polycount.toLocaleString()} tris</Badge>}
            </div>

            <p className="mt-4 text-3xl font-extrabold gradient-text">
              {avatar.priceCents === 0 ? "Free" : formatCents(avatar.priceCents)}
            </p>

            <div className="mt-5">
              <PurchasePanel
                avatarId={avatar.id}
                priceCents={avatar.priceCents}
                isSignedIn={Boolean(user)}
                isOwnListing={isOwnListing}
                alreadyOwned={alreadyOwned}
                creatorReady={avatar.creator.stripeOnboarded}
              />
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Created by</p>
              <Link
                href={`/profile/${avatar.creator.username}`}
                className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-surface-2"
              >
                <span
                  className="h-11 w-11 rounded-full bg-surface-2 bg-cover bg-center border border-border"
                  style={
                    avatar.creator.avatarImageUrl
                      ? { backgroundImage: `url(${avatar.creator.avatarImageUrl})` }
                      : undefined
                  }
                />
                <span>
                  <span className="block font-semibold">{avatar.creator.displayName}</span>
                  <span className="block text-xs text-muted">@{avatar.creator.username}</span>
                </span>
              </Link>
              <Link href={`/commissions/new?creator=${avatar.creator.username}`} className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  Request a custom commission
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
