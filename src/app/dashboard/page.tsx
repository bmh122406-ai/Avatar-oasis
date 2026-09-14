import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteAvatarButton } from "@/components/DeleteAvatarButton";
import { CommissionStatusControls } from "@/components/CommissionStatusControls";
import { Wallet, Star, UploadCloud, Package, ShoppingBag } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [myAvatars, sales, commissionsReceived, myCommissions, purchases] = await Promise.all([
    user.isCreator
      ? prisma.avatar.findMany({ where: { creatorId: user.id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    user.isCreator
      ? prisma.order.findMany({
          where: { avatar: { creatorId: user.id }, status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { avatar: true, buyer: { select: { username: true, displayName: true } } },
        })
      : Promise.resolve([]),
    user.isCreator
      ? prisma.commission.findMany({
          where: { OR: [{ creatorId: user.id }, { creatorId: null, status: "OPEN" }] },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { buyer: { select: { username: true, displayName: true } } },
        })
      : Promise.resolve([]),
    prisma.commission.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { creator: { select: { username: true, displayName: true } } },
    }),
    prisma.order.findMany({
      where: { buyerId: user.id, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { avatar: true },
    }),
  ]);

  const totalEarnedCents = sales.reduce((sum, o) => sum + o.creatorPayoutCents, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted">Welcome back, {user.displayName}.</p>
        </div>
        <div className="flex gap-2">
          {user.isCreator && (
            <>
              <Link href="/dashboard/featured"><Button variant="secondary" size="sm"><Star size={14} /> Featured slots</Button></Link>
              <Link href="/dashboard/payouts"><Button variant="secondary" size="sm"><Wallet size={14} /> Payouts</Button></Link>
              <Link href="/upload"><Button size="sm"><UploadCloud size={14} /> Upload avatar</Button></Link>
            </>
          )}
        </div>
      </div>

      {user.isCreator && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Listings" value={String(myAvatars.length)} icon={<Package size={16} />} />
          <StatCard label="Completed sales" value={String(sales.length)} icon={<ShoppingBag size={16} />} />
          <StatCard label="Total earned" value={formatCents(totalEarnedCents)} icon={<Wallet size={16} />} />
          <StatCard
            label="Payouts"
            value={user.stripeOnboarded ? "Connected" : "Not set up"}
            icon={<Star size={16} />}
            tone={user.stripeOnboarded ? "success" : "warning"}
          />
        </div>
      )}

      {user.isCreator && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">My Avatars</h2>
          {myAvatars.length === 0 ? (
            <EmptyRow text="You haven't uploaded any avatars yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {myAvatars.map((avatar) => (
                <div key={avatar.id} className="card-surface flex items-center gap-4 rounded-xl p-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-surface-2 shrink-0">
                    <Image src={avatar.thumbnailUrl} alt={avatar.title} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/avatars/${avatar.id}`} className="font-medium hover:underline line-clamp-1">
                      {avatar.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{formatCents(avatar.priceCents)}</span>
                      <Badge>{avatar.downloadCount} sales</Badge>
                      {avatar.isFeatured && avatar.featuredUntil && avatar.featuredUntil > new Date() && (
                        <Badge tone="accent"><Star size={10} className="fill-current" /> Featured</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {(!avatar.isFeatured || !avatar.featuredUntil || avatar.featuredUntil < new Date()) && (
                      <Link href="/dashboard/featured">
                        <Button size="sm" variant="secondary">Feature</Button>
                      </Link>
                    )}
                    <DeleteAvatarButton avatarId={avatar.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {user.isCreator && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Recent Sales</h2>
          {sales.length === 0 ? (
            <EmptyRow text="No sales yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {sales.map((order) => (
                <div key={order.id} className="card-surface flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm">
                  <span>
                    <span className="font-medium">{order.avatar.title}</span>{" "}
                    <span className="text-muted">to @{order.buyer.username}</span>
                  </span>
                  <span className="flex items-center gap-3 text-muted">
                    <span>{formatCents(order.amountTotalCents)}</span>
                    <span className="text-success">+{formatCents(order.creatorPayoutCents)} payout</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {user.isCreator && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Commission Requests</h2>
          {commissionsReceived.length === 0 ? (
            <EmptyRow text="No commission requests right now." />
          ) : (
            <div className="flex flex-col gap-2">
              {commissionsReceived.map((c) => (
                <div key={c.id} className="card-surface rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        From @{c.buyer.username} · {formatCents(c.budgetMinCents)}–{formatCents(c.budgetMaxCents)}
                      </p>
                    </div>
                    <Badge>{c.status.replace("_", " ")}</Badge>
                  </div>
                  <CommissionStatusControls
                    commissionId={c.id}
                    status={c.status}
                    isClaimable={!c.creatorId}
                    role="creator"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">My Commission Requests</h2>
        {myCommissions.length === 0 ? (
          <EmptyRow text="You haven't requested a commission yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {myCommissions.map((c) => (
              <div key={c.id} className="card-surface rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {c.creator ? `Assigned to @${c.creator.username}` : "Waiting for a creator"}
                    </p>
                  </div>
                  <Badge>{c.status.replace("_", " ")}</Badge>
                </div>
                <CommissionStatusControls commissionId={c.id} status={c.status} isClaimable={false} role="buyer" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 mb-16">
        <h2 className="mb-4 text-lg font-bold">My Purchases</h2>
        {purchases.length === 0 ? (
          <EmptyRow text="You haven't bought any avatars yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {purchases.map((order) => (
              <div key={order.id} className="card-surface flex items-center justify-between gap-2 rounded-xl p-3 text-sm">
                <Link href={`/avatars/${order.avatar.id}`} className="font-medium hover:underline">
                  {order.avatar.title}
                </Link>
                <a href={`/api/avatars/${order.avatar.id}/download`}>
                  <Button size="sm" variant="secondary">Download</Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "success" | "warning";
}) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {icon} {label}
      </div>
      <p
        className={`mt-2 text-xl font-bold ${
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
      {text}
    </p>
  );
}
