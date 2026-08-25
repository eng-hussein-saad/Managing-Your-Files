import type { FileStatistics as FileStatisticsData } from "@gold-era/contracts/public";
import type { CSSProperties } from "react";
import { Metric } from "../../../components/ui/surfaces";
/** Displays accessible current totals, quota, normalized distribution, and 30-day history. */
export function FileStatistics({ data }: { data: FileStatisticsData }) {
  const used = Number(data.storedBytes);
  const limit = Number(data.quota.limitBytes);
  const percent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const formatBytes = (value: string | number) => {
    const bytes = Number(value);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  };
  const maxUploads = Math.max(
    1,
    ...data.uploadHistory.map((item) => item.count),
  );
  const recentUploads = data.uploadHistory.reduce(
    (total, item) => total + item.count,
    0,
  );
  return (
    <section className="statistics" aria-label="File activity">
      <h2 className="sr-only">File activity</h2>
      <p className="sr-only">
        {data.fileCount} files · {data.storedBytes} bytes stored
      </p>
      <div className="stat-grid">
        <article className="stat-card stat-card-primary">
          <Metric
            label="Total files"
            value={data.fileCount}
            detail="in your private archive"
          />
        </article>
        <article className="stat-card">
          <Metric
            label="Storage used"
            value={formatBytes(data.storedBytes)}
            detail={`${percent}% of ${formatBytes(data.quota.limitBytes)}`}
          />
        </article>
        <article className="stat-card">
          <Metric
            label="Recent uploads"
            value={recentUploads}
            detail="during the last 30 days"
          />
        </article>
      </div>
      <div className="dashboard-grid">
        <article className="activity-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Activity</span>
              <h3>Last 30 days</h3>
            </div>
            <span className="timezone">{data.timeZone}</span>
          </div>
          <div className="activity-chart" aria-hidden="true">
            {data.uploadHistory.map((item) => (
              <span
                key={item.date}
                title={`${item.date}: ${item.count}`}
                style={{
                  height: `${Math.max(5, (item.count / maxUploads) * 100)}%`,
                }}
              />
            ))}
          </div>
          <table className="sr-only">
            <caption>Uploads by local date in {data.timeZone}</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Uploads</th>
              </tr>
            </thead>
            <tbody>
              {data.uploadHistory.map((item) => (
                <tr key={item.date}>
                  <th scope="row">{item.date}</th>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="chart-legend">
            <span>{data.uploadHistory[0]?.date}</span>
            <span>Today</span>
          </div>
        </article>
        <aside className="storage-card">
          <div className="section-heading">
            <div>
              <h3>Storage</h3>
            </div>
            <span className="ui-pill success">
              <span aria-hidden="true">✓</span> Healthy
            </span>
          </div>
          <div
            className="storage-ring"
            style={{ "--storage-percent": `${percent}%` } as CSSProperties}
          >
            <progress className="sr-only" value={used} max={limit}>
              {percent}%
            </progress>
            <span>{percent}%</span>
          </div>
          <p className="sr-only">
            <strong>{formatBytes(data.quota.remainingBytes)}</strong> available
            of {formatBytes(data.quota.limitBytes)}
          </p>
          <div className="type-breakdown">
            <h4>File types</h4>
            {data.fileCount === 0 ? (
              <p>No stored file types yet.</p>
            ) : (
              <ul>
                {data.typeDistribution.map((item) => (
                  <li key={item.type}>
                    <span>
                      <i data-type={item.type} />
                      {item.type}
                    </span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
