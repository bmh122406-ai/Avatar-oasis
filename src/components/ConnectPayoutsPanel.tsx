"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Status {
  connected: boolean;
  onboarded: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export function ConnectPayoutsPanel() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connect/status")
      .then((res) => res.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [searchParams]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start Stripe onboarding.");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Stripe onboarding.");
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="card-surface rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Stripe Connect status</h2>
        {status?.onboarded ? (
          <Badge tone="success"><CheckCircle2 size={12} /> Ready for payouts</Badge>
        ) : status?.connected ? (
          <Badge tone="warning"><AlertCircle size={12} /> Setup incomplete</Badge>
        ) : (
          <Badge><AlertCircle size={12} /> Not connected</Badge>
        )}
      </div>

      <p className="mt-2 text-sm text-muted">
        {status?.onboarded
          ? "Your account is connected. Sales automatically transfer your share, minus the platform fee, straight to your bank."
          : "Connect a Stripe account to receive payouts from avatar sales. This only takes a few minutes."}
      </p>

      {!status?.onboarded && (
        <Button className="mt-4" onClick={handleConnect} disabled={connecting}>
          {connecting && <Loader2 size={16} className="animate-spin" />}
          {status?.connected ? "Finish setup" : "Connect with Stripe"}
        </Button>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {status?.connected && (
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <StatusPill label="Details submitted" ok={Boolean(status.detailsSubmitted)} />
          <StatusPill label="Charges enabled" ok={Boolean(status.chargesEnabled)} />
          <StatusPill label="Payouts enabled" ok={Boolean(status.payoutsEnabled)} />
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${ok ? "border-success/30 bg-success/10 text-success" : "border-border text-muted"}`}>
      {label}: {ok ? "Yes" : "No"}
    </div>
  );
}
