import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/AuthProvider";
import { ConfirmProvider } from "@/components/admin/ConfirmProvider";
import { ToastProvider } from "@/components/admin/ToastProvider";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>{children}</AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
