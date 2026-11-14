"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** Free-text list editor (amenities, facilities). Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])));
    setText("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-line bg-white p-2 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-forest-mist px-3 py-1 text-sm text-forest-dark">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="rounded-full p-0.5 hover:bg-forest/10"><X className="h-3.5 w-3.5" /></button>
        </span>
      ))}
      <input id={id} value={text} onChange={(e) => setText(e.target.value)} onBlur={add} placeholder={value.length ? "" : placeholder}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1)); }}
        className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 outline-none" />
    </div>
  );
}
