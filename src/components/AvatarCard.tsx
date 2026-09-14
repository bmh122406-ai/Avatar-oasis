import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Star } from "lucide-react";

export interface AvatarCardData {
  id: string;
  title: string;
  priceCents: number;
  category: string;
  platform: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  featuredUntil?: string | Date | null;
  creator: {
    username: string;
    displayName: string;
    avatarImageUrl?: string | null;
  };
}

export function AvatarCard({ avatar }: { avatar: AvatarCardData }) {
  const isCurrentlyFeatured =
    avatar.isFeatured &&
    avatar.featuredUntil &&
    new Date(avatar.featuredUntil).getTime() > Date.now();

  return (
    <Link
      href={`/avatars/${avatar.id}`}
      className="group card-surface flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <Image
          src={avatar.thumbnailUrl}
          alt={avatar.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isCurrentlyFeatured && (
          <Badge tone="accent" className="absolute left-2 top-2 backdrop-blur-sm">
            <Star size={12} className="fill-current" /> Featured
          </Badge>
        )}
        <Badge className="absolute right-2 top-2 backdrop-blur-sm bg-black/50 text-white border-white/10">
          {avatar.platform}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-1 font-semibold">{avatar.title}</p>
        <p className="text-xs text-muted">{avatar.category}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-5 w-5 rounded-full bg-surface-2 bg-cover bg-center border border-border"
              style={
                avatar.creator.avatarImageUrl
                  ? { backgroundImage: `url(${avatar.creator.avatarImageUrl})` }
                  : undefined
              }
            />
            {avatar.creator.displayName}
          </span>
          <span className="font-bold gradient-text">
            {avatar.priceCents === 0 ? "Free" : formatCents(avatar.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
