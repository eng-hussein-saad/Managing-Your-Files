"use client";
import Link from "next/link";
import { AdminDashboard } from "../../features/admin/components/admin-dashboard";

/** Presents the exact administrator overview and administration destinations. */
export default function AdminPage() {
  return (
    <main id="main" className="app-page">
      <header className="page-heading"><div><span className="eyebrow">Administration</span><h1>Platform overview</h1><p>Current totals and recent activity from canonical records.</p></div><nav className="admin-section-nav" aria-label="Administration"><Link href="/admin/users">Users</Link><Link href="/admin/files">Files</Link><Link href="/admin/audit">Audit history</Link></nav></header>
      <AdminDashboard />
    </main>
  );
}
