"use client";

import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RoomForm } from "@/components/admin/RoomForm";
import { PageHeading } from "@/components/admin/ui";

export default function NewRoomPage() {
  return (
    <RequireAdmin>
      <PageHeading title="Add room" description="Create a new room type. Photos upload to Cloudinary when you save." />
      <RoomForm />
    </RequireAdmin>
  );
}
