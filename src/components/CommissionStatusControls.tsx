"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import type { CommissionStatus } from "@prisma/client";

interface Props {
  commissionId: string;
  status: CommissionStatus;
  isClaimable: boolean;
  role: "creator" | "buyer";
}

export function CommissionStatusControls({ commissionId, status, isClaimable, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(next: CommissionStatus) {
    setLoading(next);
    try {
      const res = await fetch(`/api/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const actions: { label: string; status: CommissionStatus; variant?: "primary" | "secondary" | "danger" }[] = [];

  if (role === "creator") {
    if (isClaimable) {
      actions.push({ label: "Claim commission", status: "ACCEPTED" });
    } else if (status === "ACCEPTED") {
      actions.push({ label: "Start work", status: "IN_PROGRESS" });
      actions.push({ label: "Decline", status: "DECLINED", variant: "danger" });
    } else if (status === "IN_PROGRESS") {
      actions.push({ label: "Mark delivered", status: "DELIVERED" });
    }
  } else {
    if (status === "DELIVERED") {
      actions.push({ label: "Confirm & complete", status: "COMPLETED" });
    }
    if (!["COMPLETED", "CANCELLED", "DECLINED"].includes(status)) {
      actions.push({ label: "Cancel request", status: "CANCELLED", variant: "danger" });
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          size="sm"
          variant={action.variant ?? "secondary"}
          onClick={() => setStatus(action.status)}
          disabled={loading !== null}
        >
          {loading === action.status && <Loader2 size={14} className="animate-spin" />}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
