import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AvatarCard } from "@/components/AvatarCard";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ShieldCheck, Wallet, Star, Palette } from "lucide-react";

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    prisma.avatar.findMany({
      where: { status: "PUBLISHED", isFeatured: true, featuredUntil: { gt: new Date() } },
      orderBy: { featuredUntil: "desc" },
      take: 8,
      include: {
        creator: {
          select: { username: true, displayName: true, avatarImageUrl: true },
        },
      },
    }),
    prisma.avatar.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        creator: {
          select: { username: true, displayName: true, avatarImageUrl: true },
        },
      },
    }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(600px circle at 20% 20%, var(--accent), transparent), radial-gradient(600px circle at 80% 0%, var(--accent-2), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Your avatar,{" "}
              <span className="gradient-text">discovered.</span>
            </h1>
            <p className="mt-5 text-lg text-muted">
              Avatar Oasis is the marketplace for VRChat avatars — buy ready-to-use
              models, sell your own creations with secure Stripe payouts, and
              commission custom work from top creators.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/browse">
                <Button size="lg">
                  Browse Avatars <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureBadge
              icon={<ShieldCheck size={20} />}
              title="Secure checkout"
              body="Files are only released to a buyer after Stripe confirms payment."
            />
            <FeatureBadge
              icon={<Wallet size={20} />}
              title="Real payouts"
              body="Creators connect Stripe and get paid automatically, minus a transparent platform fee."
            />
            <FeatureBadge
              icon={<Palette size={20} />}
              title="Custom commissions"
              body="Can't find the perfect avatar? Request custom work from any creator."
            />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Star size={20} className="text-accent fill-current" /> Featured
              Avatars
            </h2>
            <Link href="/browse?featured=true" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((avatar) => (
              <AvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Newest Listings</h2>
          <Link href="/browse" className="text-sm text-accent hover:underline">
            Browse all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            No avatars published yet — be the first to{" "}
            <Link href="/upload" className="text-accent hover:underline">
              upload one
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((avatar) => (
              <AvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeatureBadge({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
