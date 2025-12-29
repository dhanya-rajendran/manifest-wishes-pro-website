"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from 'next/image';

type NoteColor =
  | "red"
  | "green"
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "pink"
  | "yellow";

type Note = { id: string; text: string; color: NoteColor };
type Section = {
  id: string;
  title: string;
  x: number;
  y: number;
  width?: number;
  notes: Note[];
};

type ImageNode = {
  id: string;
  x: number;
  y: number;
  src: string;
  size: number; // adjustable size in px
};

const COLOR_MAP: Record<NoteColor, string> = {
  red: "bg-red-300",
  green: "bg-green-300",
  blue: "bg-blue-300",
  orange: "bg-orange-300",
  purple: "bg-purple-300",
  teal: "bg-teal-300",
  pink: "bg-pink-300",
  yellow: "bg-yellow-300",
};

const DEFAULT_SECTIONS: Section[] = [
  {
    id: "big-goals",
    title: "BIG GOALS",
    x: 30,
    y: 110,
    notes: [
      { id: "bg-1", text: "Big", color: "red" },
      { id: "bg-2", text: "Goals", color: "green" },
      { id: "bg-3", text: "Vision", color: "blue" },
    ],
  },
  {
    id: "career",
    title: "CAREER & BUSINESS",
    x: 620,
    y: 110,
    notes: [
      { id: "c-1", text: "Career", color: "orange" },
      { id: "c-2", text: "Business", color: "blue" },
      { id: "c-3", text: "Growth", color: "green" },
    ],
  },
  {
    id: "finance",
    title: "FINANCE & WEALTH",
    x: 60,
    y: 360,
    notes: [
      { id: "f-1", text: "Finance", color: "orange" },
      { id: "f-2", text: "Wealth", color: "blue" },
      { id: "f-3", text: "Savings", color: "green" },
    ],
  },
  {
    id: "health",
    title: "HEALTH, WELLNESS & SELF-GROWTH",
    x: 600,
    y: 340,
    notes: [
      { id: "h-1", text: "Health", color: "red" },
      { id: "h-2", text: "Wellness", color: "blue" },
      { id: "h-3", text: "Self-Growth", color: "green" },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function VisionBoardInteractive() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ sectionId: string; noteId: string } | null>(null);
  const [currentColor, setCurrentColor] = useState<NoteColor>("pink");
  const colors: NoteColor[] = ["red", "green", "blue", "orange", "purple", "teal", "pink", "yellow"];
  const DEFAULT_IMAGE_SIZE = 140;
  const [images, setImages] = useState<ImageNode[]>([]);

  // Board responsive min size
  const boardSize = useMemo(() => {
    if (typeof window === "undefined") return { minW: 320, minH: 480 };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const minW = Math.min(Math.max(320, Math.floor(w * 0.9)), 1200);
    const minH = Math.min(Math.max(480, Math.floor(h * 0.75)), 1000);
    return { minW, minH };
  }, []);

  // Persist to localStorage for quick recall
  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem("vision-board@state");
        if (raw) {
          const parsed = JSON.parse(raw) as { sections: Section[]; images: ImageNode[] };
          if (parsed?.sections) setSections(parsed.sections);
          if (parsed?.images) setImages(parsed.images);
        }
    } catch { void 0 }
    }, 0);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => {
      try {
        localStorage.setItem("vision-board@state", JSON.stringify({ sections, images }));
    } catch { void 0 }
    }, 0);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [sections, images]);

  function addImage(src: string) {
    if (images.length >= 3) return;
    const bw = boardRef.current?.clientWidth ?? 800;
    const bh = boardRef.current?.clientHeight ?? 600;
    const nx = Math.max(0, Math.floor(bw / 2) - Math.floor(DEFAULT_IMAGE_SIZE / 2));
    const ny = Math.max(60, Math.floor(bh / 2) - Math.floor(DEFAULT_IMAGE_SIZE / 2));
    const img: ImageNode = { id: uid(), x: nx, y: ny, src, size: DEFAULT_IMAGE_SIZE };
    setImages((prev) => [...prev, img]);
  }

  function addImageFromFile(file: File) {
    if (images.length >= 3) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (dataUrl) addImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function onPointerDownImage(e: React.PointerEvent, id: string) {
    const startX = e.clientX;
    const startY = e.clientY;
    const img = images.find((m) => m.id === id);
    if (!img) return;
    const baseX = img.x;
    const baseY = img.y;
    const baseSize = img.size;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const bw = boardRef.current?.clientWidth ?? 0;
      const bh = boardRef.current?.clientHeight ?? 0;
      const maxX = Math.max(0, bw - baseSize);
      const minY = 40;
      const maxY = Math.max(minY, bh - baseSize);
      const nextX = Math.min(Math.max(baseX + dx, 0), maxX);
      const nextY = Math.min(Math.max(baseY + dy, minY), maxY);
      setImages((prev) => prev.map((m) => (m.id === id ? { ...m, x: nextX, y: nextY } : m)));
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function onPointerDownResizeImage(e: React.PointerEvent, id: string) {
    const img = images.find((m) => m.id === id);
    if (!img) return;
    const startX = e.clientX;
    const initialSize = img.size;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const minSize = 80;
      const bw = boardRef.current?.clientWidth ?? 0;
      const bh = boardRef.current?.clientHeight ?? 0;
      const maxSizeByBoard = Math.max(minSize, Math.min(bw, bh));
      const maxSize = Math.min(240, maxSizeByBoard);
      const nextSize = Math.min(Math.max(initialSize + dx, minSize), maxSize);
      setImages((prev) => prev.map((m) => (m.id === id ? { ...m, size: nextSize } : m)));
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function onPointerDownSection(e: React.PointerEvent, id: string) {
    const startX = e.clientX;
    const startY = e.clientY;
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    const baseX = section.x;
    const baseY = section.y;
    setDragId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Clamp within board bounds
      const boardW = boardRef.current?.clientWidth ?? 0;
      const boardH = boardRef.current?.clientHeight ?? 0;
      // Measure current element width to avoid hydration mismatch from window checks
      const el = boardRef.current?.querySelector(`[data-sec="${id}"]`) as HTMLDivElement | null;
      const sectionW = el?.offsetWidth ?? 256;
      const maxX = Math.max(0, boardW - sectionW);
      const minY = 40; // keep below header area
      const maxY = Math.max(minY, boardH - 240); // rough lower bound to avoid overflow
      const nextX = Math.min(Math.max(baseX + dx, 0), maxX);
      const nextY = Math.min(Math.max(baseY + dy, minY), maxY);
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, x: nextX, y: nextY } : s)));
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setDragId(null);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function onPointerDownResize(e: React.PointerEvent, id: string) {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    const startX = e.clientX;
    const baseWidth = (typeof window !== "undefined" && window.innerWidth >= 768) ? 288 : 256;
    const initialW = section.width ?? baseWidth;
    const baseX = section.x;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const boardW = boardRef.current?.clientWidth ?? 0;
      const minW = 220;
      const maxW = Math.max(minW, boardW - baseX); // keep inside right bound
      const nextW = Math.min(Math.max(initialW + dx, minW), maxW);
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, width: nextW } : s)));
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function updateNote(sectionId: string, noteId: string, patch: Partial<Note>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, notes: s.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)) }
          : s
      )
    );
  }

  function addNote(sectionId: string) {
    const target = sections.find((s) => s.id === sectionId);
    if (!target) return;
    // Enforce per-section note cap of 6 (two rows of 3)
    if (target.notes.length >= 6) return;
    const n: Note = { id: uid(), text: "New note", color: currentColor };
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, notes: [...s.notes, n] } : s)));
  }

  function deleteNote(sectionId: string, noteId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) } : s))
    );
  }


  function deleteSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSectionTitle(id: string, title: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function resetBoard() {
    // Clamp default positions within current board bounds to avoid cards outside
    const boardW = boardRef.current?.clientWidth ?? 0;
    const boardH = boardRef.current?.clientHeight ?? 0;
    // Prefer measured width of any existing section to avoid SSR/CSR mismatch
    const measuredDefaultW = (boardRef.current?.querySelector('[data-sec]') as HTMLElement | null)?.offsetWidth ?? 256;
    const minY = 40;
    const maxY = Math.max(minY, boardH - 240);
    const clamped = DEFAULT_SECTIONS.map((s) => {
      const w = s.width ?? measuredDefaultW;
      const maxX = Math.max(0, boardW - w);
      return {
        ...s,
        x: Math.min(Math.max(s.x, 0), maxX),
        y: Math.min(Math.max(s.y, minY), maxY),
      };
    });
    setSections(clamped);
  }

  return (
    <div
      ref={boardRef}
      className="relative mx-auto w-full rounded-2xl shadow-xl overflow-auto"
      style={{
        backgroundColor: "#c89b6d",
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "6px 6px, 6px 6px",
        backgroundPosition: "0 0, 3px 3px",
        boxShadow: "inset 0 20px 40px rgba(0,0,0,0.15), inset 0 -20px 40px rgba(0,0,0,0.12)",
        ...(boardSize ? { minWidth: boardSize.minW, minHeight: boardSize.minH } : {}),
      }}
    >
      {/* Global pastel color palette */}
      <div className="absolute bottom-4 right-4 z-50 bg-white/85 backdrop-blur-sm rounded-md shadow p-2">
        <div className="text-[11px] font-medium mb-1 text-neutral-700">Colors</div>
        <div className="grid grid-cols-8 gap-1">
          {colors.map((c) => (
            <button
              key={`global-${c}`}
              className={`w-6 h-6 rounded-md border border-black/70 shadow ${COLOR_MAP[c]} ${
                selected && sections.find((s) => s.id === selected.sectionId)?.notes.find((n) => n.id === selected.noteId)?.color === c
                  ? "ring-2 ring-white"
                  : !selected && currentColor === c
                  ? "ring-2 ring-white"
                  : ""
              }`}
              onClick={() => {
                if (selected) {
                  updateNote(selected.sectionId, selected.noteId, { color: c });
                }
                setCurrentColor(c);
              }}
              title={c}
            />
          ))}
        </div>
        <div className="mt-1 text-[10px] text-neutral-600">
          {selected
            ? "Click a color to apply to the selected note."
            : "Pick a color, then add a note or select one."}
        </div>
        {/* Images: palette and upload (max 3) */}
        <div className="mt-2 border-t border-neutral-200 pt-2">
          <div className="text-[11px] font-medium mb-1 text-neutral-700">Images</div>
          <div className="flex items-center gap-2">
            <label
              className={`px-2 py-1 rounded text-xs bg-neutral-200 text-neutral-800 cursor-pointer hover:bg-neutral-300 ${images.length >= 3 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
              title={images.length >= 3 ? "Max 3 images" : "Upload Image"}
            >
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f && images.length < 3) addImageFromFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {images.length >= 3 && (
            <div className="mt-1 text-[10px] text-red-700">Max 3 images on board</div>
          )}
        </div>
      </div>

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 z-40 flex gap-2 items-center">
        <button
          className="px-3 py-1 rounded-md text-white text-sm bg-neutral-800/70 hover:bg-neutral-800 shadow-md"
          onClick={resetBoard}
        >
          Reset Board
        </button>
      </div>

      {/* Magazine header */}
      <div className="absolute left-1/2 -translate-x-1/2 top-6 flex items-end gap-1 select-none">
        {"VISION BOARD".split(" ").map((word, wi) => (
          <div key={wi} className="flex gap-1">
            {word.split("").map((ch, i) => (
              <span
                key={`${word}-${i}`}
                className="inline-block px-2 py-1 text-3xl md:text-4xl font-black tracking-wider shadow-md"
                style={{
                  transform: `rotate(${[-5,3,-2,4,-3,6][i % 6]}deg)`,
                  background: ["#f39c12","#e74c3c","#9b59b6","#1abc9c","#2ecc71","#3498db"][i % 6],
                  color: "#fff",
                  textShadow: "0 1px 0 rgba(0,0,0,0.3)",
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Ribbon connecting pins */}
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {images.length >= 2 && (() => {
          const pins = [...images]
            .sort((a, b) => a.x - b.x)
            .map((m) => {
              const x = m.x + m.size / 2;
              const y = m.y + 14; // pin center near top
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              points={pins}
              stroke="#3b82f6"
              strokeWidth={4}
              strokeOpacity={0.85}
              fill="none"
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
              strokeLinecap="round"
            />
          );
        })()}
      </svg>

      {/* Draggable images with pin and frame */}
      {images.map((img) => (
        <div
          key={img.id}
          className="absolute z-30 select-none"
          style={{ left: img.x, top: img.y, width: img.size, height: img.size }}
        >
          {/* Pin */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-xl" />
          {/* Frame */}
          <div
            className="relative bg-white p-2 shadow-lg border border-neutral-300"
            style={{ width: img.size, height: img.size }}
            onPointerDown={(e) => onPointerDownImage(e, img.id)}
          >
            <Image src={img.src} alt="photo" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" draggable={false} unoptimized />
            {/* Resize handle */}
            <div
              className="absolute bottom-1 right-1 w-3 h-3 bg-neutral-400 rounded-sm cursor-se-resize"
              onPointerDown={(e) => onPointerDownResizeImage(e, img.id)}
              title="Resize image"
            />
          </div>
        </div>
      ))}

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.id}
          className={`absolute w-64 md:w-72 bg-white/90 border border-neutral-300 shadow-lg ${
            dragId === section.id ? "z-40" : "z-20"
          }`}
          style={{
            left: section.x,
            top: section.y,
            width: section.width ?? undefined,
          }}
          data-sec={section.id}
        >
          {/* Pin */}
          <div className="absolute -top-3 left-8 w-6 h-6 rounded-full bg-gray-300 shadow-xl" />
          <div
            className="cursor-grab active:cursor-grabbing p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between"
            onPointerDown={(e) => onPointerDownSection(e, section.id)}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              className="font-semibold tracking-wide text-sm outline-none"
              onBlur={(e) => updateSectionTitle(section.id, e.currentTarget.textContent || section.title)}
            >
              {section.title}
            </div>
            <button
              className="ml-2 text-xs px-2 py-1 rounded bg-red-400 hover:bg-red-500 text-white transition-colors"
              onClick={() => deleteSection(section.id)}
            >
              Delete
            </button>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            {section.notes.map((note) => (
              <div key={note.id} className="relative">
                <div
                  className={`h-20 rounded-sm shadow-md border border-black/30 overflow-hidden ${COLOR_MAP[note.color]} ${
                    selected && selected.sectionId === section.id && selected.noteId === note.id
                      ? "ring-2 ring-white"
                      : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onPointerDown={() => setSelected({ sectionId: section.id, noteId: note.id })}
                  onMouseEnter={() => setSelected({ sectionId: section.id, noteId: note.id })}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="h-full w-full text-white font-semibold text-xs md:text-sm outline-none px-2 text-center break-words whitespace-pre-wrap overflow-y-auto"
                    onBlur={(e) => updateNote(section.id, note.id, { text: e.currentTarget.textContent || note.text })}
                    onFocus={() => setSelected({ sectionId: section.id, noteId: note.id })}
                  >
                    {note.text}
                  </div>
                </div>
                {/* Note actions */}
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <button
                    className="w-5 h-5 rounded-full bg-black/60 text-white text-[10px] leading-5"
                    onClick={() => deleteNote(section.id, note.id)}
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {section.notes.length < 6 && (
              <button
                className="h-20 rounded-sm border-2 border-dashed border-neutral-400 text-neutral-600 hover:bg-neutral-100"
                onClick={() => addNote(section.id)}
                title="Add a note"
              >
                + Add note
              </button>
            )}
          </div>
          {/* Resize handle */}
          <div
            className="absolute bottom-1 right-1 w-3 h-3 bg-neutral-400 rounded-sm cursor-se-resize"
            onPointerDown={(e) => onPointerDownResize(e, section.id)}
            title="Resize card"
          />
        </div>
      ))}
    </div>
  );
}