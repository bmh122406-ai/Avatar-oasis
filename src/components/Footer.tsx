import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div>
            <p className="font-bold">
              Avatar <span className="gradient-text">Oasis</span>
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              A marketplace for VRChat avatars, built by creators, for creators.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Marketplace</span>
              <Link href="/browse" className="text-muted hover:text-foreground">Browse Avatars</Link>
              <Link href="/commissions" className="text-muted hover:text-foreground">Commissions</Link>
              <Link href="/upload" className="text-muted hover:text-foreground">Sell an Avatar</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Creators</span>
              <Link href="/dashboard" className="text-muted hover:text-foreground">Dashboard</Link>
              <Link href="/dashboard/payouts" className="text-muted hover:text-foreground">Payouts</Link>
              <Link href="/dashboard/featured" className="text-muted hover:text-foreground">Featured Slots</Link>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted">
          © {new Date().getFullYear()} Avatar Oasis. Not affiliated with VRChat Inc.
        </p>
      </div>
    </footer>
  );
}
