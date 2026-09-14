import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Palette, Clock } from "lucide-react";

const statusTone: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  OPEN: "accent",
  ACCEPTED: "warning",
  IN_PROGRESS: "warning",
  DELIVERED: "success",
  COMPLETED: "success",
  DECLINED: "danger",
  CANCELLED: "danger",
};

export default async function CommissionsPage() {
  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      buyer: { select: { username: true, displayName: true } },
      creator: { select: { username: true, displayName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Commissions</h1>
          <p className="mt-1 text-muted">Custom avatar work, requested by the community.</p>
        </div>
        <Link href="/commissions/new">
          <Button><Palette size={16} /> Post a commission</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {commissions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            No commission requests yet.
          </p>
        ) : (
          commissions.map((c) => (
            <div key={c.id} className="card-surface rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted line-clamp-2">{c.description}</p>
                </div>
                <Badge tone={statusTone[c.status] ?? "default"}>{c.status.replace("_", " ")}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                <span>
                  Budget: {formatCents(c.budgetMinCents)}–{formatCents(c.budgetMaxCents)}
                </span>
                <span>Requested by @{c.buyer.username}</span>
                {c.creator && <span>Assigned to @{c.creator.username}</span>}
                {c.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Due {new Date(c.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
