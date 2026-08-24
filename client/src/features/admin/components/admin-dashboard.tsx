"use client";
import { ErrorPanel } from "../../../components/status/error-panel";
import { formatBytes, formatCount, formatDate } from "../../../lib/presentation/format";
import { useAdminStatistics } from "../hooks/use-admin-monitoring";

/** Displays exact current totals, type distribution, and recent global uploads. */
export function AdminDashboard() {
  const statistics = useAdminStatistics();
  if (statistics.isLoading) return <p role="status" aria-busy="true">Loading platform statistics…</p>;
  if (statistics.error) return <ErrorPanel message="Platform statistics could not be loaded." retry={() => void statistics.refetch()} />;
  const data = statistics.data;
  if (!data) return null;
  return <section className="admin-dashboard">
    <div className="stat-grid"><article className="stat-card"><span>Users</span><strong>{formatCount(data.totalUsers)}</strong></article><article className="stat-card"><span>Files</span><strong>{formatCount(data.totalFiles)}</strong></article><article className="stat-card"><span>Stored</span><strong>{formatBytes(data.storedBytes)}</strong></article></div>
    <div className="dashboard-grid"><article className="activity-card"><h2>File types</h2><ul className="type-breakdown">{data.typeDistribution.map((item) => <li key={item.type}><span>{item.type}</span><strong>{formatCount(item.count)}</strong></li>)}</ul></article><article className="storage-card"><h2>Recent uploads</h2>{data.recentUploads.length ? <ul>{data.recentUploads.map((file) => <li key={file.id}><strong>{file.originalName}</strong> by {file.owner.name} <small>{formatDate(file.uploadedAt)}</small></li>)}</ul> : <p>No files have been uploaded.</p>}</article></div>
  </section>;
}
