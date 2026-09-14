"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle2, Download } from "lucide-react";

type Result =
  | { type: "avatar_purchase"; order: { status: string; avatar: { id: string; title: string } } }
  | { type: "featured_slot"; slot: { status: string; avatar: { id: string; title: string } } }
  | null;

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [result, setResult] = useState<Result>(null);
  const [attempts, setAttempts] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/orders/by-session?session_id=${sessionId}`);
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else if (attempts > 6) {
        setNotFound(true);
      }
    }
    poll();
    const interval = setInterval(() => {
      setAttempts((a) => a + 1);
      poll();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const isComplete =
    result?.type === "avatar_purchase"
      ? result.order.status === "COMPLETED"
      : result?.type === "featured_slot"
      ? result.slot.status === "ACTIVE"
      : false;

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      {isComplete ? (
        <>
          <CheckCircle2 size={48} className="mx-auto text-success" />
          <h1 className="mt-4 text-2xl font-bold">Payment complete!</h1>
          {result?.type === "avatar_purchase" && (
            <>
              <p className="mt-2 text-muted">You now own &quot;{result.order.avatar.title}&quot;.</p>
              <a href={`/api/avatars/${result.order.avatar.id}/download`} className="mt-6 inline-block">
                <Button><Download size={16} /> Download now</Button>
              </a>
            </>
          )}
          {result?.type === "featured_slot" && (
            <>
              <p className="mt-2 text-muted">
                &quot;{result.slot.avatar.title}&quot; is now featured on the homepage.
              </p>
              <Link href="/" className="mt-6 inline-block">
                <Button>View homepage</Button>
              </Link>
            </>
          )}
        </>
      ) : notFound ? (
        <>
          <h1 className="text-xl font-bold">We couldn&apos;t confirm this payment yet</h1>
          <p className="mt-2 text-muted">
            It may still be processing. Check your dashboard in a moment.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button variant="secondary">Go to dashboard</Button>
          </Link>
        </>
      ) : (
        <>
          <Loader2 size={32} className="mx-auto animate-spin text-muted" />
          <p className="mt-4 text-muted">Confirming your payment...</p>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
