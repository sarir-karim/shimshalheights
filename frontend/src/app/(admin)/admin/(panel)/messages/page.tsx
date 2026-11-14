"use client";

import { useState } from "react";
import { Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { useToast } from "@/components/admin/ToastProvider";
import { EmptyState, ErrorState, Loading, PageHeading, Pagination, SearchBox, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { buildQuery } from "@/lib/adminApi";
import { useDebounced, useFetch } from "@/hooks/useFetch";
import { api, errorMessage } from "@/lib/adminApi";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageRecord } from "@/types/admin";

export default function MessagesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [read, setRead] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading, error, reload } = useFetch<MessageRecord[]>(`/contact${buildQuery({ q: dq, status, isRead: read, page, limit: 15 })}`);
  const [open, setOpen] = useState<MessageRecord | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const filtered = Boolean(q || status || read);

  const view = async (m: MessageRecord) => {
    try { const r = await api<MessageRecord>("GET", `/contact/${m.id}`); setOpen(r.data); void reload(); } // opening marks it read
    catch (err) { toast.error(errorMessage(err)); }
  };
  const patch = async (m: MessageRecord, body: Partial<Pick<MessageRecord, "status" | "isRead">>, msg: string) => {
    try { const r = await api<MessageRecord>("PATCH", `/contact/${m.id}`, { body }); setOpen(r.data); toast.success(msg); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (m: MessageRecord) => {
    if (!(await confirm({ title: "Delete this message?", message: `The message from ${m.name} will be permanently removed.`, confirmLabel: "Delete", danger: true }))) return;
    try { await api("DELETE", `/contact/${m.id}`); toast.success("Message deleted"); setOpen(null); await reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <>
      <PageHeading title="Messages" description="Enquiries from the website contact form." />
      <form onSubmit={(e) => e.preventDefault()} aria-label="Filter messages" className="mb-5 grid gap-3 rounded-xl2 border border-stone-line bg-white p-4 shadow-soft sm:grid-cols-[2fr_1fr_1fr_auto]">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email, subject or text" label="Search messages" />
        <div><label htmlFor="m-status" className="sr-only">Status</label><select id="m-status" className="input-field !py-2.5" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="new">New</option><option value="replied">Replied</option><option value="archived">Archived</option></select></div>
        <div><label htmlFor="m-read" className="sr-only">Read state</label><select id="m-read" className="input-field !py-2.5" value={read} onChange={(e) => { setRead(e.target.value); setPage(1); }}><option value="">Read and unread</option><option value="false">Unread only</option><option value="true">Read only</option></select></div>
        {filtered && <Button variant="secondary" className="!py-2.5" onClick={() => { setQ(""); setStatus(""); setRead(""); setPage(1); }}>Clear</Button>}
      </form>

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={filtered ? "No messages match those filters" : "No messages yet"} description={filtered ? undefined : "Messages sent through the contact form will appear here."} />}
      {data && data.length > 0 && (
        <div aria-busy={loading}>
          <ul className="divide-y divide-stone-line overflow-hidden rounded-xl2 border border-stone-line bg-white shadow-soft">
            {data.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => view(m)} className={cn("flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-stone-deep/50", !m.isRead && "bg-sand-light/25")}>
                  {m.isRead ? <MailOpen className="mt-1 h-5 w-5 shrink-0 text-slate-muted" aria-hidden /> : <Mail className="mt-1 h-5 w-5 shrink-0 text-forest" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", !m.isRead && "font-semibold text-forest-dark")}>{m.subject}{!m.isRead && <span className="sr-only"> (unread)</span>}</span>
                    <span className="block truncate text-sm text-slate-soft">{m.name} · {m.message}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1"><span className="text-xs text-slate-muted">{fmtDateTime(m.createdAt)}</span><StatusBadge status={m.status} /></span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination meta={meta} onPage={setPage} />
        </div>
      )}

      <Modal open={open !== null} title={open?.subject ?? ""} onClose={() => setOpen(null)} wide>
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-slate-muted">From <strong className="text-forest-dark">{open.name}</strong> · {fmtDateTime(open.createdAt)}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} className="inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 font-semibold text-forest hover:bg-forest-mist"><Mail className="h-4 w-4" aria-hidden />{open.email}</a>
              {open.phone && <a href={`tel:${open.phone}`} className="inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 font-semibold text-forest hover:bg-forest-mist"><Phone className="h-4 w-4" aria-hidden />{open.phone}</a>}
            </div>
            <p className="whitespace-pre-wrap rounded-xl bg-stone-deep/60 p-4 text-slate">{open.message}</p>
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-stone-line pt-4">
              <div><label htmlFor="msg-status" className="block text-sm font-semibold text-forest-dark">Status</label>
                <select id="msg-status" className="input-field mt-1 capitalize" value={open.status} onChange={(e) => patch(open, { status: e.target.value as MessageRecord["status"] }, "Status updated")}>{["new", "replied", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => patch(open, { isRead: !open.isRead }, open.isRead ? "Marked unread" : "Marked read")}>{open.isRead ? "Mark unread" : "Mark read"}</Button>
                <Button variant="secondary" className="!text-red-700" onClick={() => remove(open)}><Trash2 className="h-4 w-4" aria-hidden />Delete</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
