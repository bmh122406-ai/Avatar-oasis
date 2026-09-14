"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/money";
import { Loader2, Download, ShieldCheck } from "lucide-react";

interface PurchasePanelProps {
  avatarId: string;
  priceCents: number;
  isSignedIn: boolean;
  isOwnListing: boolean;
  alreadyOwned: boolean;
  creatorReady: boolean;
}

export function PurchasePanel({
  avatarId,
  priceCents,
  isSignedIn,
  isOwnListing,
  alreadyOwned,
  creatorReady,
}: PurchasePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleBuy() {
    if (!isSignedIn) {
      router.push(`/login?next=/avatars/${avatarId}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (isOwnListing || alreadyOwned) {
    return (
      <div className="flex flex-col gap-2">
        <a href={`/api/avatars/${avatarId}/download`}>
          <Button className="w-full" variant="secondary">
            <Download size={16} /> Download File
          </Button>
        </a>
        {isOwnListing && (
          <p className="text-center text-xs text-muted">This is your own listing.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" onClick={handleBuy} disabled={loading || !creatorReady}>
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        {priceCents === 0 ? "Get for Free" : `Buy Now — ${formatCents(priceCents)}`}
      </Button>
      {!creatorReady && (
        <p className="text-center text-xs text-warning">
          This creator hasn&apos;t finished payout setup — purchases are disabled for now.
        </p>
      )}
      {error && <p className="text-center text-xs text-danger">{error}</p>}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck size={12} /> Secure checkout via Stripe. File unlocks after payment.
      </p>
    </div>
  );
}
