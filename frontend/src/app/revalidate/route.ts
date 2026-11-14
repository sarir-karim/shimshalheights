import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * The Express API calls this after an admin saves content, so the public site shows the change right away
 * (instead of waiting for the 60 second cache). Protected by a shared secret.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret") ?? "";
  const a = Buffer.from(given); const b = Buffer.from(expected ?? "");
  if (!expected || expected.length < 16 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag("content", { expire: 0 }); // expire immediately (not stale-while-revalidate)
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
