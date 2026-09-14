"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    isCreator: searchParams.get("as") === "creator",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      await refresh();
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-muted">Join Avatar Oasis to buy, sell, and commission.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="username" hint="letters, numbers, underscores">Username</Label>
          <Input
            id="username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="password" hint="min 8 characters">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isCreator}
            onChange={(e) => setForm({ ...form, isCreator: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          I want to sell avatars as a creator
        </label>

        <FieldError>{error}</FieldError>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
