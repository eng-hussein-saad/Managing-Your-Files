"use client";
import { AdminDashboard } from "../../features/admin/components/admin-dashboard";
import { AdminPageHeader } from "../../features/admin/components/admin-page-header";

/** Presents the exact administrator overview and administration destinations. */
export default function AdminPage() {
  return (
    <main id="main" className="app-page">
      <AdminPageHeader
        title="Platform pulse"
        description="A current metadata-only snapshot across Fileora. Read-only views do not create audit events."
      />
      <AdminDashboard />
    </main>
  );
}
