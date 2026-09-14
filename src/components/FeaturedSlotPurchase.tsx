"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatCents } from "@/lib/money";
import { Loader2, Star } from "lucide-react";

interface AvailabilityInfo {
  activeCount: number;
  maxSlots: number;
  slotsAvailable: number;
  priceCents: number;
  durationDays: number;
  nextAvailableAt: string | null;
}

interface EligibleAvatar {
  id: string;
  title: string;
}

export function FeaturedSlotPurchase({ avatars }: { avatars: EligibleAvatar[] }) {
  const [info, setInfo] = useState<AvailabilityInfo | null>(null);
  const [selected, setSelected] = useState(avatars[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/featured").then((res) => res.json()).then(setInfo);
  }, []);

  async function handlePurchase() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/featured/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="card-surface rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Star size={18} className="text-accent fill-current" />
        <h2 className="font-semibold">Feature an avatar</h2>
      </div>

      {info && (
        <p className="mt-2 text-sm text-muted">
          {info.slotsAvailable} of {info.maxSlots} homepage slots available ·{" "}
          {formatCents(info.priceCents)} for {info.durationDays} days
          {info.slotsAvailable === 0 && info.nextAvailableAt && (
            <> · next opening {new Date(info.nextAvailableAt).toLocaleDateString()}</>
          )}
        </p>
      )}

      {avatars.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Publish an avatar first to feature it.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="sm:max-w-xs">
            {avatars.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </Select>
          <Button
            onClick={handlePurchase}
            disabled={loading || !info || info.slotsAvailable === 0}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {info && info.slotsAvailable === 0 ? "All slots taken" : "Purchase featured slot"}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
