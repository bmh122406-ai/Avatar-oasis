"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function EditProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [website, setWebsite] = useState("");
  const [vrchat, setVrchat] = useState("");
  const [avatarImage, setAvatarImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setBio(user.bio);
    try {
      const social = JSON.parse(user.socialLinks || "{}");
      setTwitter(social.twitter ?? "");
      setDiscord(social.discord ?? "");
      setWebsite(social.website ?? "");
      setVrchat(social.vrchat ?? "");
    } catch {
      // ignore malformed stored JSON
    }
  }, [user]);

  if (user === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <Link href="/login?next=/settings/profile" className="mt-4 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("displayName", displayName);
      formData.set("bio", bio);
      formData.set("twitter", twitter);
      formData.set("discord", discord);
      formData.set("website", website);
      formData.set("vrchat", vrchat);
      if (avatarImage) formData.set("avatarImage", avatarImage);
      if (bannerImage) formData.set("bannerImage", bannerImage);

      const res = await fetch("/api/profile", { method: "PATCH", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      await refresh();
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <p className="mt-1 text-muted">This is what buyers and creators see on your public page.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about your style, tools, turnaround time..." />
        </div>

        <div>
          <Label htmlFor="avatarImage">Profile picture</Label>
          <input id="avatarImage" type="file" accept="image/*" onChange={(e) => setAvatarImage(e.target.files?.[0] ?? null)} className="text-sm text-muted" />
        </div>
        <div>
          <Label htmlFor="bannerImage">Banner image</Label>
          <input id="bannerImage" type="file" accept="image/*" onChange={(e) => setBannerImage(e.target.files?.[0] ?? null)} className="text-sm text-muted" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="twitter">Twitter/X URL</Label>
            <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." />
          </div>
          <div>
            <Label htmlFor="discord">Discord</Label>
            <Input id="discord" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username#0000" />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="vrchat">VRChat profile</Label>
            <Input id="vrchat" value={vrchat} onChange={(e) => setVrchat(e.target.value)} placeholder="https://vrchat.com/home/user/..." />
          </div>
        </div>

        <FieldError>{error}</FieldError>
        {success && <p className="text-sm text-success">Profile updated.</p>}

        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}
