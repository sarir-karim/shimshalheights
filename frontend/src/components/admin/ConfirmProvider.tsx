"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/admin/Modal";

interface ConfirmOptions { title: string; message: string; confirmLabel?: string; danger?: boolean }
const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

/** `const confirm = useConfirm(); if (await confirm({...})) { ... }` replaces window.confirm with an accessible dialog. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => { resolver.current = resolve; setOpts(o); }), []);
  const close = (value: boolean) => { resolver.current?.(value); resolver.current = null; setOpts(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={opts !== null} title={opts?.title ?? ""} onClose={() => close(false)}>
        <p className="text-slate-soft">{opts?.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={() => close(true)} className={opts?.danger ? "!bg-red-700 hover:!bg-red-800" : ""}>{opts?.confirmLabel ?? "Confirm"}</Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
