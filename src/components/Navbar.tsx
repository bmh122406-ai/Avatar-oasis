"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/commissions", label: "Commissions" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-bg text-white">
            <Sparkles size={18} />
          </span>
          <span>
            Avatar <span className="gradient-text">Oasis</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                pathname?.startsWith(link.href) ? "text-foreground" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.isCreator && (
                <Link href="/upload">
                  <Button size="sm" variant="secondary">
                    Upload Avatar
                  </Button>
                </Link>
              )}
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
              >
                <span className="h-8 w-8 overflow-hidden rounded-full bg-surface-2 bg-cover bg-center border border-border" style={user.avatarImageUrl ? { backgroundImage: `url(${user.avatarImageUrl})` } : undefined} />
                {user.displayName}
              </Link>
              <Button size="sm" variant="ghost" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="primary">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted hover:text-foreground">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={`/profile/${user.username}`} onClick={() => setOpen(false)} className="text-sm font-medium text-muted hover:text-foreground">
                  My Profile
                </Link>
                {user.isCreator && (
                  <Link href="/upload" onClick={() => setOpen(false)} className="text-sm font-medium text-muted hover:text-foreground">
                    Upload Avatar
                  </Link>
                )}
                <button onClick={logout} className="text-left text-sm font-medium text-danger">
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-1">
                <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" variant="secondary" className="w-full">Log in</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" variant="primary" className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
