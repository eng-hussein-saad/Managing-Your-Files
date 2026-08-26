"use client";
import { ErrorPanel } from "../../../components/status/error-panel";
import {
  formatBytes,
  formatCount,
  formatDate,
} from "../../../lib/presentation/format";
import { useAdminStatistics } from "../hooks/use-admin-monitoring";
import { Metric, Skeleton } from "../../../components/ui/surfaces";
import { FileIcon, UsersIcon } from "../../../components/ui/icons";
import { TypeDistributionChart } from "../../../components/charts/type-distribution-chart";

/** Displays exact current totals, type distribution, and recent global uploads. */
export function AdminDashboard() {
  const statistics = useAdminStatistics();
  if (statistics.isLoading)
    return <Skeleton label="Loading platform statistics" lines={6} />;
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
      <div className="admin-dashboard-panels">
        <article className="admin-type-card">
          <div className="admin-panel-heading">
            <h2>Most uploaded file types</h2>
            <span className="ui-pill neutral">Current files</span>
          </div>
          <TypeDistributionChart
            items={data.typeDistribution}
            title="Platform files by type"
            emptyMessage="No file types have been uploaded."
          />
        </article>
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
      </div>
    </section>
  );
}
