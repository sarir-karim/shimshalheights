"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { GalleryImage } from "@/types";

interface LightboxProps {
  items: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

/** Accessible modal viewer: Esc closes, arrow keys navigate, focus returns to the trigger on close. */
export function Lightbox({ items, index, onClose, onChange }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onChange],
  );

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      lastFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  if (index === null) return null;
  const item = items[index];
  if (!item) return null;

  const nav = "absolute top-1/2 -translate-y-1/2 rounded-full bg-stone/90 p-3 text-forest-dark hover:bg-white";

  return (
    <div role="dialog" aria-modal="true" aria-label={`Image viewer: ${item.title}`} className="fixed inset-0 z-50 flex items-center justify-center bg-slate/95 p-4 sm:p-10" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close viewer" className="absolute right-4 top-4 rounded-full bg-stone/90 p-3 text-forest-dark hover:bg-white">
        <X className="h-5 w-5" />
      </button>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" className={`${nav} left-3 sm:left-8`} onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" aria-label="Next image" className={`${nav} right-3 sm:right-8`} onClick={(e) => { e.stopPropagation(); go(1); }}>
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <figure className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <SmartImage image={item.image} sizes="90vw" priority wrapperClassName="aspect-[3/2] w-full rounded-xl2" />
        <figcaption className="mt-4 text-center text-stone">
          <span className="font-display text-xl">{item.title}</span>
          <span className="ml-3 text-sm text-stone/60">{index + 1} / {items.length}</span>
        </figcaption>
      </figure>
    </div>
  );
}
