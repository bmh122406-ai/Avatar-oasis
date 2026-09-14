"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteAvatarButton({ avatarId }: { avatarId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/avatars/${avatarId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
      <Trash2 size={14} />
    </Button>
  );
}
