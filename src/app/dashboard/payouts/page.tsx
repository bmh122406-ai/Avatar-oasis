import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { ConnectPayoutsPanel } from "@/components/ConnectPayoutsPanel";

export default async function PayoutsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/payouts");
  if (!user.isCreator) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p className="mt-1 text-muted">
        Avatar Oasis keeps {PLATFORM_FEE_PERCENT}% of each sale as a platform fee; the rest
        transfers to your connected Stripe account automatically.
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <ConnectPayoutsPanel />
        </Suspense>
      </div>
    </div>
  );
}
