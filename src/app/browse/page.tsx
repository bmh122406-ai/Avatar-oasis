"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AvatarCard, type AvatarCardData } from "@/components/AvatarCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { avatarCategories, avatarPlatforms } from "@/lib/validation";
import { Search, Loader2 } from "lucide-react";

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [platform, setPlatform] = useState(searchParams.get("platform") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [featuredOnly] = useState(searchParams.get("featured") === "true");
  const [avatars, setAvatars] = useState<AvatarCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (platform) params.set("platform", platform);
    if (sort) params.set("sort", sort);
    if (featuredOnly) params.set("featured", "true");

    const res = await fetch(`/api/avatars?${params.toString()}`);
    const data = await res.json();
    setAvatars(data.avatars ?? []);
    setLoading(false);
  }, [q, category, platform, sort, featuredOnly]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    router.replace(`?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...(platform ? { platform } : {}),
      ...(sort !== "newest" ? { sort } : {}),
    }).toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, platform, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Browse Avatars</h1>
      <p className="mt-1 text-muted">
        {featuredOnly ? "Currently featured listings." : "Full-body avatars, modifications, and accessories from the community."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search avatars..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {avatarCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">All platforms</option>
          {avatarPlatforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex justify-end">
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
          <option value="newest">Newest</option>
          <option value="popular">Most downloaded</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </Select>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20 text-muted">
            <Loader2 className="animate-spin" />
          </div>
        ) : avatars.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            No avatars match your search.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {avatars.map((avatar) => (
              <AvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  );
}
