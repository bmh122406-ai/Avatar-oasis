import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { parseSocialLinks } from "@/lib/user";
import { AvatarCard } from "@/components/AvatarCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Globe, X as TwitterIcon, MessageCircle, Boxes, Settings, Palette } from "lucide-react";

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[username]">) {
  const { username } = await params;

  const profile = await prisma.user.findUnique({ where: { username } });
  if (!profile) notFound();

  const [avatars, viewer, salesCount] = await Promise.all([
    prisma.avatar.findMany({
      where: { creatorId: profile.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true, displayName: true, avatarImageUrl: true } },
      },
    }),
    getCurrentUser(),
    prisma.order.count({ where: { avatar: { creatorId: profile.id }, status: "COMPLETED" } }),
  ]);

  const social = parseSocialLinks(profile.socialLinks);
  const isOwnProfile = viewer?.id === profile.id;

  return (
    <div>
      <div
        className="h-48 w-full bg-cover bg-center sm:h-64"
        style={{
          backgroundColor: "var(--surface-2)",
          backgroundImage: profile.bannerImageUrl ? `url(${profile.bannerImageUrl})` : undefined,
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-surface-2 relative">
              {profile.avatarImageUrl ? (
                <Image src={profile.avatarImageUrl} alt={profile.displayName} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-3xl font-bold text-muted">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <p className="text-muted">@{profile.username}</p>
            </div>
          </div>

          <div className="flex gap-2 pb-1">
            {isOwnProfile ? (
              <Link href="/settings/profile">
                <Button variant="secondary" size="sm"><Settings size={14} /> Edit profile</Button>
              </Link>
            ) : (
              <Link href={`/commissions/new?creator=${profile.username}`}>
                <Button size="sm"><Palette size={14} /> Request commission</Button>
              </Link>
            )}
          </div>
        </div>

        {profile.bio && <p className="mt-6 max-w-2xl whitespace-pre-line text-muted">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          {profile.isCreator && <Badge tone="accent">Creator</Badge>}
          <Badge><Boxes size={12} /> {avatars.length} avatars</Badge>
          {profile.isCreator && <Badge>{salesCount} sales</Badge>}
        </div>

        {(social.website || social.twitter || social.discord || social.vrchat) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
            {social.website && (
              <a href={social.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                <Globe size={14} /> Website
              </a>
            )}
            {social.twitter && (
              <a href={social.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                <TwitterIcon size={14} /> Twitter/X
              </a>
            )}
            {social.discord && (
              <span className="flex items-center gap-1.5">
                <MessageCircle size={14} /> {social.discord}
              </span>
            )}
            {social.vrchat && (
              <a href={social.vrchat} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                VRChat Profile
              </a>
            )}
          </div>
        )}

        <div className="mt-10 border-t border-border pt-8 pb-16">
          <h2 className="mb-5 text-lg font-bold">Portfolio</h2>
          {avatars.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
              No published avatars yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {avatars.map((avatar) => (
                <AvatarCard key={avatar.id} avatar={avatar} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
