"use client";
import { useEffect, useState } from "react";
import VisionBoardInteractive from "@/components/VisionBoardInteractive";

type Item = { id: string; title: string; imageUrl?: string; description?: string; createdAt: string };

export default function VisionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

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
        <button onClick={() => setDrawer(true)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white">Add Gallery Item</button>
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
                  <img src={it.imageUrl} alt={it.title} className="h-40 w-full rounded-t object-cover" />
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
              <h2 className="text-sm font-semibold">Add Gallery Item</h2>
              <button onClick={() => setDrawer(false)} className="rounded border px-2 py-1 text-xs">Close</button>
            </div>
            <div className="space-y-3 p-4">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Title" />
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Image URL (optional)" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Description (optional)" />
              <button onClick={save} className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}