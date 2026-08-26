"use client";

import type { FileStatistics as FileStatisticsData } from "@gold-era/contracts/public";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Metric } from "../../../components/ui/surfaces";
import { TypeDistributionChart } from "../../../components/charts/type-distribution-chart";
/** Displays accessible current totals, quota, normalized distribution, and 30-day history. */
export function FileStatistics({ data }: { data: FileStatisticsData }) {
  const reduceMotion = useReducedMotion();
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
      <motion.div
        className="stat-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
          },
        }}
      >
        <motion.article
          className="stat-card stat-card-primary"
          variants={metricVariants(reduceMotion)}
        >
          <Metric
            label="Total files"
            value={data.fileCount}
            detail="in your private archive"
          />
        </motion.article>
        <motion.article
          className="stat-card"
          variants={metricVariants(reduceMotion)}
        >
          <Metric
            label="Storage used"
            value={formatBytes(data.storedBytes)}
            detail={`${percent}% of ${formatBytes(data.quota.limitBytes)}`}
          />
        </motion.article>
        <motion.article
          className="stat-card"
          variants={metricVariants(reduceMotion)}
        >
          <Metric
            label="Recent uploads"
            value={recentUploads}
            detail="during the last 30 days"
          />
        </motion.article>
      </motion.div>
      <motion.div
        className="dashboard-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: reduceMotion ? 0 : 0.18,
              staggerChildren: reduceMotion ? 0 : 0.1,
            },
          },
        }}
      >
        <motion.article
          className="activity-card"
          variants={panelVariants(reduceMotion)}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Activity</span>
              <h3>Last 30 days</h3>
            </div>
            <span className="timezone">{data.timeZone}</span>
          </div>
          <div className="activity-chart" aria-hidden="true">
            {data.uploadHistory.map((item, index) => (
              <motion.span
                key={item.date}
                data-empty={item.count === 0 ? "true" : undefined}
                title={`${item.date}: ${item.count}`}
                initial={{ scaleY: reduceMotion ? 1 : 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.4,
                  delay: reduceMotion ? 0 : index * 0.025,
                  ease: "easeOut",
                }}
                style={{
                  height: `${Math.max(5, (item.count / maxUploads) * 100)}%`,
                  transformOrigin: "bottom center",
                }}
              />
            ))}
          </div>
          <div className="sr-only">
            <table>
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
          </div>
          <div className="chart-legend">
            <span>{data.uploadHistory[0]?.date}</span>
            <span>Today</span>
          </div>
        </motion.article>
        <motion.aside
          className="storage-card"
          variants={panelVariants(reduceMotion)}
        >
          <div className="section-heading">
            <div>
              <h3>Storage</h3>
            </div>
            <span className="ui-pill success">
              <span aria-hidden="true">✓</span> Healthy
            </span>
          </div>
          <motion.div
            className="storage-ring"
            initial={{
              opacity: reduceMotion ? 1 : 0,
              scale: reduceMotion ? 1 : 0.88,
            }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : 0.32,
              ease: "easeOut",
            }}
            style={{ "--storage-percent": `${percent}%` } as CSSProperties}
          >
            <progress className="sr-only" value={used} max={limit}>
              {percent}%
            </progress>
            <span>{percent}%</span>
          </motion.div>
          <p className="sr-only">
            <strong>{formatBytes(data.quota.remainingBytes)}</strong> available
            of {formatBytes(data.quota.limitBytes)}
          </p>
          <TypeDistributionChart
            items={data.typeDistribution}
            title="Files by type"
            emptyMessage="No stored file types yet."
          />
        </motion.aside>
      </motion.div>
    </section>
  );
}

/** Keeps dashboard metric entrances consistent and motion-preference aware. */
function metricVariants(reduceMotion: boolean | null) {
  return {
    hidden: {
      opacity: 1,
      y: reduceMotion ? 0 : 12,
      scale: reduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reduceMotion ? 0 : 0.32,
        ease: "easeOut" as const,
      },
    },
  };
}

/** Defines the larger dashboard panel reveal without changing document layout. */
function panelVariants(reduceMotion: boolean | null) {
  return {
    hidden: { opacity: 1, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.38,
        ease: "easeOut" as const,
      },
    },
  };
}
