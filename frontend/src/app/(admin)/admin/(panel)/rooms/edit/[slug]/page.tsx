"use client";

import { useParams } from "next/navigation";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RoomForm } from "@/components/admin/RoomForm";
import { ErrorState, Loading, PageHeading } from "@/components/admin/ui";
import { useFetch } from "@/hooks/useFetch";
import type { AdminRoom } from "@/types/admin";

export default function EditRoomPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error, reload } = useFetch<AdminRoom>(`/rooms/${slug}`);
  return (
    <RequireAdmin>
      <PageHeading title={data ? `Edit ${data.name}` : "Edit room"} />
      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && <RoomForm key={data.id} room={data} />}
    </RequireAdmin>
  );
}
