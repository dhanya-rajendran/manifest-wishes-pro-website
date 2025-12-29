"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import VisionBoardInteractive from "@/components/VisionBoardInteractive";

type Item = { id: string; title: string; imageUrl?: string; description?: string; createdAt: string };

export default function VisionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function load() {
    const res = await fetch("/api/vision", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await fetch("/api/vision", { credentials: "include", signal: ac.signal });
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items ?? []);
      })();
    }, 0);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, []);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setError("");

    // If a file is selected, validate and upload first
    if (imageFile) {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(imageFile.type)) {
        setError("Unsupported image type. Use PNG, JPEG, or WEBP.");
        return;
      }
      const max = 500 * 1024; // 500KB
      if (imageFile.size > max) {
        setError("File too large. Max 500KB.");
        return;
      }
      const fd = new FormData();
      fd.append("file", imageFile);
      const up = await fetch("/api/upload/vision", { method: "POST", credentials: "include", body: fd });
      if (!up.ok) {
        const msg = await up.json().catch(() => ({}));
        setError(msg?.error || "Upload failed");
        return;
      }
      const data = await up.json();
      setImageUrl(data.url);
    }
    const res = await fetch("/api/vision", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed, imageUrl: imageUrl || undefined, description: description || undefined }),
    });
    if (res.ok) {
      setDrawer(false);
      setTitle("");
      setImageUrl("");
      setDescription("");
      setImageFile(null);
      setPreview("");
      setError("");
      await load();
    }
  }
  async function remove(id: string) {
    const res = await fetch(`/api/vision/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-gray-600">Design your interactive vision board</p>
        <button onClick={() => setDrawer(true)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white">Add Vision Item</button>
      </div>

      <VisionBoardInteractive />

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold">Gallery (saved items)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.length === 0 ? (
            <div className="rounded border p-6 text-sm text-gray-600">No items yet.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="rounded border bg-white">
                {it.imageUrl ? (
                  <Image src={it.imageUrl} alt={it.title} width={800} height={160} className="h-40 w-full rounded-t object-cover" unoptimized />
                ) : (
                  <div className="h-40 w-full rounded-t bg-gray-100" />
                )}
                <div className="p-3">
                  <div className="text-sm font-semibold">{it.title}</div>
                  {it.description && <div className="mt-1 text-xs text-gray-600">{it.description}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => remove(it.id)} className="rounded border px-2 py-1 text-xs text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-[360px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Create Vision Item</h2>
              <button onClick={() => setDrawer(false)} className="rounded border px-2 py-1 text-xs">Close</button>
            </div>
            <div className="space-y-3 p-4">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Title" />
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    setError("");
                    if (f) setPreview(URL.createObjectURL(f)); else setPreview("");
                  }}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
                {preview && (
                  <Image src={preview} alt="Preview" width={800} height={128} className="h-32 w-full rounded object-cover" unoptimized />
                )}
                <p className="text-xs text-gray-600">PNG/JPEG/WEBP, max 500KB</p>
                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Description (optional)" />
              <button onClick={save} className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Upload & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}