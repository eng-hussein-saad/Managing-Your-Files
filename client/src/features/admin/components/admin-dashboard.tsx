"use client";
import { ErrorPanel } from "../../../components/status/error-panel";
import {
  formatBytes,
  formatCount,
  formatDate,
} from "../../../lib/presentation/format";
import { useAdminStatistics } from "../hooks/use-admin-monitoring";
import { Metric } from "../../../components/ui/surfaces";
import { FileIcon, UsersIcon } from "../../../components/ui/icons";

/** Displays exact current totals, type distribution, and recent global uploads. */
export function AdminDashboard() {
  const statistics = useAdminStatistics();
  if (statistics.isLoading)
    return (
      <p role="status" aria-busy="true">
        Loading platform statistics…
      </p>
    );
  if (statistics.error)
    return (
      <ErrorPanel
        message="Platform statistics could not be loaded."
        retry={() => void statistics.refetch()}
      />
    );
  const data = statistics.data;
  if (!data) return null;
  return (
    <section className="admin-dashboard">
      <div className="stat-grid admin-metrics">
        <article className="stat-card">
          <span className="admin-metric-icon">
            <UsersIcon />
          </span>
          <Metric
            label="Total users"
            value={formatCount(data.totalUsers)}
            detail="Current accounts"
          />
        </article>
        <article className="stat-card">
          <span className="admin-metric-icon">
            <FileIcon />
          </span>
          <Metric
            label="Total files"
            value={formatCount(data.totalFiles)}
            detail="Retained metadata records"
          />
        </article>
        <article className="stat-card">
          <span className="admin-metric-scope">ALL</span>
          <Metric
            label="Stored bytes"
            value={formatBytes(data.storedBytes)}
            detail="Across current files"
          />
        </article>
      </div>
      <article className="admin-recent-card">
        <div className="admin-panel-heading">
          <h2>Recent uploads</h2>
          <span className="ui-pill neutral">Metadata only</span>
        </div>
        {data.recentUploads.length ? (
          <div className="admin-recent-list">
            {data.recentUploads.map((file) => (
              <div className="admin-recent-row" key={file.id}>
                <strong>{file.originalName}</strong>
                <span>{file.owner.name}</span>
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No files have been uploaded.</p>
        )}
      </article>
    </section>
  );
}
