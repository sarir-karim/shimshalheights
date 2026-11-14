"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ExistingImage { url: string; publicId: string; alt?: string }
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface Props {
  label: string;
  existing?: ExistingImage[];
  newFiles: File[];
  onNewFiles: (files: File[]) => void;
  removed: string[];
  onRemovedChange: (publicIds: string[]) => void;
  multiple?: boolean;
  max?: number;
}

/** Shows current images (mark for removal / undo), adds new ones with previews, and validates type and size before upload. */
export function ImageManager({ label, existing = [], newFiles, onNewFiles, removed, onRemovedChange, multiple = true, max = 10 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const previews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const kept = existing.length - removed.length;
  const room = max - kept - newFiles.length;

  const add = (list: FileList | null) => {
    if (!list) return;
    setProblem(null);
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!TYPES.includes(f.type)) { setProblem(`"${f.name}" is not a JPEG, PNG, WebP or AVIF image.`); continue; }
      if (f.size > MAX_BYTES) { setProblem(`"${f.name}" is larger than 5 MB.`); continue; }
      accepted.push(f);
    }
    const next = multiple ? [...newFiles, ...accepted].slice(0, newFiles.length + Math.max(room, 0)) : accepted.slice(0, 1);
    if (multiple && accepted.length > room) setProblem(`You can have at most ${max} images.`);
    onNewFiles(next);
    if (input.current) input.current.value = "";
  };

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-forest-dark">{label}</legend>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {existing.map((img) => {
          const gone = removed.includes(img.publicId);
          return (
            <li key={img.publicId} className="relative overflow-hidden rounded-xl border border-stone-line">
              
              <img src={img.url} alt={img.alt || "Current image"} className={cn("aspect-[4/3] w-full object-cover", gone && "opacity-30")} />
              <button type="button" onClick={() => onRemovedChange(gone ? removed.filter((r) => r !== img.publicId) : [...removed, img.publicId])}
                aria-label={gone ? "Keep this image" : "Remove this image"} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-slate shadow hover:bg-white">
                {gone ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-red-700" />}
              </button>
              {gone && <span className="absolute inset-x-0 bottom-0 bg-red-700 px-2 py-1 text-center text-xs font-semibold text-white">Will be removed on save</span>}
            </li>
          );
        })}
        {newFiles.map((f, i) => (
          <li key={`${f.name}-${i}`} className="relative overflow-hidden rounded-xl border-2 border-sand">
            
            <img src={previews[i]} alt={`New image: ${f.name}`} className="aspect-[4/3] w-full object-cover" />
            <button type="button" onClick={() => onNewFiles(newFiles.filter((_, j) => j !== i))} aria-label={`Discard ${f.name}`} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 shadow hover:bg-white"><Trash2 className="h-4 w-4 text-red-700" /></button>
            <span className="absolute inset-x-0 bottom-0 bg-sand px-2 py-1 text-center text-xs font-semibold text-slate">New, uploads on save</span>
          </li>
        ))}
      </ul>
      {(multiple ? room > 0 : true) && (
        <>
          <input ref={input} id={`file-${label}`} type="file" accept={TYPES.join(",")} multiple={multiple} className="sr-only" onChange={(e) => add(e.target.files)} />
          <Button variant="secondary" className="mt-3 !py-2" onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4" aria-hidden />{multiple ? "Add images" : existing.length || newFiles.length ? "Replace image" : "Choose image"}</Button>
        </>
      )}
      <p className="mt-2 text-xs text-slate-muted">JPEG, PNG, WebP or AVIF, up to 5 MB each.</p>
      {problem && <p role="alert" className="mt-1 text-sm text-red-700">{problem}</p>}
    </fieldset>
  );
}
