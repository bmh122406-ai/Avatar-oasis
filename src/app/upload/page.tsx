"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { avatarCategories, avatarPlatforms } from "@/lib/validation";
import { Loader2, UploadCloud, ImagePlus } from "lucide-react";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(avatarCategories[0]);
  const [platform, setPlatform] = useState<string>(avatarPlatforms[0]);
  const [polycount, setPolycount] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="mt-2 text-muted">You need a creator account to upload avatars.</p>
        <Link href="/login?next=/upload" className="mt-4 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  if (user && !user.isCreator) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-bold">Creator account required</h1>
        <p className="mt-2 text-muted">
          Your account is set up as a buyer. Update your profile settings to become a creator, or contact support.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!thumbnail) return setError("A thumbnail image is required.");
    if (!avatarFile) return setError("The avatar package file is required.");

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("priceCents", String(Math.round(Number(price || 0) * 100)));
      formData.set("category", category);
      formData.set("platform", platform);
      formData.set("tags", JSON.stringify(tags));
      if (polycount) formData.set("polycount", polycount);
      formData.set("thumbnail", thumbnail);
      formData.set("avatarFile", avatarFile);
      previewImages.forEach((file) => formData.append("previewImages", file));

      const res = await fetch("/api/avatars", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/avatars/${data.avatar.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Upload an avatar</h1>
      <p className="mt-1 text-muted">
        List a VRChat avatar for sale. Your package file stays private until a buyer completes payment.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Celestial Fox — Full Avatar" />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included, toggles, physbones, quest compatibility notes..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {avatarCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {avatarPlatforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" hint="USD, 0 for free">Price</Label>
            <Input id="price" type="number" min={0} step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25.00" />
          </div>
          <div>
            <Label htmlFor="polycount" hint="optional">Polycount</Label>
            <Input id="polycount" type="number" min={0} value={polycount} onChange={(e) => setPolycount(e.target.value)} placeholder="32000" />
          </div>
        </div>

        <div>
          <Label htmlFor="tags" hint="comma-separated, up to 10">Tags</Label>
          <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="fox, furry, quest, kawaii" />
        </div>

        <div>
          <Label htmlFor="thumbnail">Thumbnail image</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-muted hover:border-accent">
            <ImagePlus size={18} />
            {thumbnail ? thumbnail.name : "Choose a square thumbnail image"}
            <input id="thumbnail" type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div>
          <Label htmlFor="previewImages" hint="optional, up to 6">Preview images</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-muted hover:border-accent">
            <ImagePlus size={18} />
            {previewImages.length > 0 ? `${previewImages.length} image(s) selected` : "Add extra screenshots"}
            <input
              id="previewImages"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setPreviewImages(Array.from(e.target.files ?? []).slice(0, 6))}
            />
          </label>
        </div>

        <div>
          <Label htmlFor="avatarFile" hint=".unitypackage, .zip, or .vrca">Avatar package file</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-muted hover:border-accent">
            <UploadCloud size={18} />
            {avatarFile ? avatarFile.name : "Choose the file buyers will download"}
            <input
              id="avatarFile"
              type="file"
              accept=".unitypackage,.zip,.vrca"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <FieldError>{error}</FieldError>

        <Button type="submit" disabled={loading} size="lg" className="mt-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Publish listing
        </Button>
      </form>
    </div>
  );
}
