"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2, ImagePlus } from "lucide-react";

function CommissionForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCreator = searchParams.get("creator");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarBase, setAvatarBase] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="mt-2 text-muted">Log in to request a custom commission.</p>
        <Link href="/login?next=/commissions/new" className="mt-4 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const min = Math.round(Number(budgetMin || 0) * 100);
    const max = Math.round(Number(budgetMax || 0) * 100);
    if (max < min) return setError("Max budget must be greater than or equal to min budget.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("avatarBase", avatarBase);
      formData.set("budgetMinCents", String(min));
      formData.set("budgetMaxCents", String(max));
      if (deadline) formData.set("deadline", new Date(deadline).toISOString());
      if (targetCreator) formData.set("creatorUsername", targetCreator);
      formData.set("contactNote", contactNote);
      referenceFiles.forEach((file) => formData.append("referenceFiles", file));

      const res = await fetch("/api/commissions", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push("/commissions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Request a commission</h1>
      <p className="mt-1 text-muted">
        {targetCreator
          ? `You're requesting custom work from @${targetCreator}.`
          : "Describe what you need and any creator can pick it up, or a specific one can respond."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Custom fox avatar with 3 outfit toggles" />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Style, references, must-have features, quest support, etc." />
        </div>

        <div>
          <Label htmlFor="avatarBase" hint="optional">Existing base / VRChat avatar link</Label>
          <Input id="avatarBase" value={avatarBase} onChange={(e) => setAvatarBase(e.target.value)} placeholder="Link to a base model you already own, if any" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budgetMin" hint="USD">Min budget</Label>
            <Input id="budgetMin" type="number" min={0} step="1" required value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="50" />
          </div>
          <div>
            <Label htmlFor="budgetMax" hint="USD">Max budget</Label>
            <Input id="budgetMax" type="number" min={0} step="1" required value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="150" />
          </div>
        </div>

        <div>
          <Label htmlFor="deadline" hint="optional">Deadline</Label>
          <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="referenceFiles" hint="optional, up to 5 images">Reference images</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-muted hover:border-accent">
            <ImagePlus size={18} />
            {referenceFiles.length > 0 ? `${referenceFiles.length} image(s) selected` : "Add mood boards / references"}
            <input
              id="referenceFiles"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setReferenceFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            />
          </label>
        </div>

        <div>
          <Label htmlFor="contactNote" hint="optional">Anything else?</Label>
          <Textarea id="contactNote" rows={3} value={contactNote} onChange={(e) => setContactNote(e.target.value)} placeholder="Preferred contact method, availability, etc." />
        </div>

        <FieldError>{error}</FieldError>

        <Button type="submit" disabled={loading} size="lg" className="mt-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Submit request
        </Button>
      </form>
    </div>
  );
}

export default function NewCommissionPage() {
  return (
    <Suspense fallback={null}>
      <CommissionForm />
    </Suspense>
  );
}
