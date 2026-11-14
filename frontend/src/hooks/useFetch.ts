"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/adminApi";
import type { ApiMeta } from "@/types/admin";

interface State<T> { data: T | null; meta?: ApiMeta; error: string | null; loading: boolean }

/** GET helper with loading/error state, manual reload, and protection against out-of-order responses. */
export function useFetch<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: path !== null });
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (path === null) return;
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api<T>("GET", path);
      if (id === seq.current) setState({ data: res.data, meta: res.meta, error: null, loading: false });
    } catch (err) {
      if (id === seq.current) setState((s) => ({ ...s, error: errorMessage(err), loading: false }));
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);
  return { ...state, reload: load };
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
