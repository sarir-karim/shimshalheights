import { backendUrl } from "@/config/site";
import { ApiError } from "@/lib/adminApi";

interface Options { revalidate?: number | false; tags?: string[] }
export interface ServerResult<T> { data: T; meta?: { total?: number; page?: number; totalPages?: number } }

/**
 * Server-side GET against the Express API. Responses are cached by Next.js for `revalidate` seconds (default 60)
 * and are also dropped instantly when the API calls POST /revalidate after an admin edit (tag "content").
 */
export async function apiGet<T>(path: string, { revalidate = 60, tags = ["content"] }: Options = {}): Promise<ServerResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api${path}`, { next: { revalidate, tags }, headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError("The content service is temporarily unavailable.", 0, "NETWORK");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new ApiError(json?.message ?? "Request failed", res.status, json?.code ?? "ERROR");
  return { data: json.data as T, meta: json.meta };
}
