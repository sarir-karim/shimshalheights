import type { ApiMeta } from "@/types/admin";

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public fieldErrors: { field: string; message: string }[] = []) {
    super(message);
  }
}

export interface ApiResult<T> { data: T; meta?: ApiMeta }
type Query = Record<string, string | number | boolean | undefined | null>;

export function buildQuery(query?: Query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Single entry point for admin calls. Same-origin (/api proxied by Next), cookie session, standard error shape. */
export async function api<T = unknown>(method: string, path: string, opts: { body?: unknown; form?: FormData; query?: Query } = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}${buildQuery(opts.query)}`, {
      method,
      credentials: "same-origin",
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "NETWORK");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    if (res.status === 401 && !path.startsWith("/auth/login") && typeof window !== "undefined") window.dispatchEvent(new Event("admin:unauthorized"));
    throw new ApiError(json?.message ?? "Something went wrong", res.status, json?.code ?? "ERROR", json?.errors ?? []);
  }
  return { data: json.data as T, meta: json.meta };
}

export const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong. Please try again.");

/** Builds multipart bodies: scalars as strings, arrays/objects as JSON, files under `fileField`. */
export function toFormData(fields: Record<string, unknown>, files: File[] = [], fileField = "images") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  for (const f of files) form.append(fileField, f);
  return form;
}
