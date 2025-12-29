"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type ThreeSixNineState = {
  manifestation: string;
  morning: string[]; // 3
  afternoon: string[]; // 6
  evening: string[]; // 9
};

const STORAGE_KEY = "manifestwishespro_369";

function getDayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeDefaultState(): ThreeSixNineState {
  return {
    manifestation: "",
    morning: Array(3).fill(""),
    afternoon: Array(6).fill(""),
    evening: Array(9).fill(""),
  };
}

export default function ThreeSixNineMethod() {
  const dayKey = useMemo(() => getDayKey(), []);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ThreeSixNineState>(makeDefaultState());
  const saveTimer = useRef<number | null>(null);

  // Mark mounted asynchronously
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Load persisted state after mount
  useEffect(() => {
    let next: ThreeSixNineState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown> | null;
        const val = data && typeof data === "object" ? (data[dayKey] as unknown) : null;
        if (val && typeof val === "object") {
          const obj = val as Partial<ThreeSixNineState>;
          next = {
            manifestation: obj.manifestation ?? "",
            morning: Array.isArray(obj.morning) ? obj.morning.slice(0, 3).concat(Array(Math.max(0, 3 - (obj.morning?.length ?? 0))).fill("")) : Array(3).fill(""),
            afternoon: Array.isArray(obj.afternoon) ? obj.afternoon.slice(0, 6).concat(Array(Math.max(0, 6 - (obj.afternoon?.length ?? 0))).fill("")) : Array(6).fill(""),
            evening: Array.isArray(obj.evening) ? obj.evening.slice(0, 9).concat(Array(Math.max(0, 9 - (obj.evening?.length ?? 0))).fill("")) : Array(9).fill(""),
          };
        }
      }
    } catch { void 0 }
    const id = window.requestAnimationFrame(() => {
      if (next) setState(next);
    });
    return () => window.cancelAnimationFrame(id);
  }, [dayKey]);

  // Debounced autosave on state changes
  useEffect(() => {
    if (!mounted) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        (data as Record<string, unknown>)[dayKey] = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch { void 0 }
    }, 350);
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [state, mounted, dayKey]);

  const handleChange = (section: "manifestation" | "morning" | "afternoon" | "evening", index: number | null, value: string) => {
    setState(prev => {
      if (section === "manifestation") {
        return { ...prev, manifestation: value };
      }
      const arr = [...prev[section]];
      if (typeof index === "number" && index >= 0 && index < arr.length) {
        arr[index] = value;
      }
      return { ...prev, [section]: arr } as ThreeSixNineState;
    });
  };

  const handleClear = () => {
    const next = makeDefaultState();
    setState(next);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      delete (data as Record<string, unknown>)[dayKey];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { void 0 }
  };

  // Compute counts for DB sync
  const counts = useMemo(() => {
    const morningCount = state.morning.filter(v => v && v.trim().length > 0).length;
    const afternoonCount = state.afternoon.filter(v => v && v.trim().length > 0).length;
    const eveningCount = state.evening.filter(v => v && v.trim().length > 0).length;
    return { morningCount, afternoonCount, eveningCount };
  }, [state]);

  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function saveToDb() {
    const phrase = state.manifestation.trim();
    if (!phrase) {
      setSaveStatus("error");
      setErrorMsg("Please enter a manifestation before saving.");
      return;
    }
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/369", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dayKey,
          phrase,
          morningCount: counts.morningCount,
          afternoonCount: counts.afternoonCount,
          eveningCount: counts.eveningCount,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed" }));
        setSaveStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Failed to save to DB.");
        return;
      }
      setSaveStatus("saved");
    } catch (e) {
      console.log("🚀 ~ saveToDb ~ e:", e)
      setSaveStatus("error");
      setErrorMsg("Network error while saving.");
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-xl backdrop-blur-md ring-1 ring-white/40">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">✨ 369 Method</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={saveToDb}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-300"
            title="Save today to database"
          >
            Save to DB
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-300"
          >
            Clear
          </button>
        </div>
      </div>

      {saveStatus === "error" && (
        <div className="mt-2 text-sm text-red-600">{errorMsg || "Could not save."}</div>
      )}
      {saveStatus === "saved" && (
        <div className="mt-2 text-sm text-green-700">Saved to database.</div>
      )}

      {/* Main manifestation */}
      <div className="mt-4">
        <input
          type="text"
          value={state.manifestation}
          onChange={e => handleChange("manifestation", null, e.target.value)}
          placeholder="Enter your main manifestation..."
          className="w-full rounded-full border border-gray-200 bg-white/80 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Morning */}
      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold text-gray-700">☀️ Morning Affirmations (3)</div>
        <div className="space-y-3">
          {state.morning.map((val, i) => (
            <input
              key={`m-${i}`}
              type="text"
              value={val}
              onChange={e => handleChange("morning", i, e.target.value)}
              placeholder="Write your affirmation..."
              className="w-full rounded-full border border-gray-200 bg-white/80 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ))}
        </div>
      </div>

      {/* Afternoon */}
      <div className="mt-8">
        <div className="mb-2 text-sm font-semibold text-gray-700">⭐ Afternoon Affirmations (6)</div>
        <div className="space-y-3">
          {state.afternoon.map((val, i) => (
            <input
              key={`a-${i}`}
              type="text"
              value={val}
              onChange={e => handleChange("afternoon", i, e.target.value)}
              placeholder="Write your affirmation..."
              className="w-full rounded-full border border-gray-200 bg-white/80 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ))}
        </div>
      </div>

      {/* Evening */}
      <div className="mt-8">
        <div className="mb-2 text-sm font-semibold text-gray-700">🌙 Evening Affirmations (9)</div>
        <div className="space-y-3">
          {state.evening.map((val, i) => (
            <input
              key={`e-${i}`}
              type="text"
              value={val}
              onChange={e => handleChange("evening", i, e.target.value)}
              placeholder="Write your affirmation..."
              className="w-full rounded-full border border-gray-200 bg-white/80 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ))}
        </div>
      </div>
      {/* Counts preview */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border bg-white/80 p-4 text-sm">
          <div className="font-semibold">Morning filled</div>
          <div className="mt-1">{counts.morningCount} / 3</div>
        </div>
        <div className="rounded border bg-white/80 p-4 text-sm">
          <div className="font-semibold">Afternoon filled</div>
          <div className="mt-1">{counts.afternoonCount} / 6</div>
        </div>
        <div className="rounded border bg-white/80 p-4 text-sm">
          <div className="font-semibold">Evening filled</div>
          <div className="mt-1">{counts.eveningCount} / 9</div>
        </div>
      </div>
    </div>
  );
}