"use client";

import { motion, useReducedMotion } from "framer-motion";

type DistributionItem = {
  type: string;
  count: number;
};

/** Renders an animated horizontal distribution with an exact accessible table. */
export function TypeDistributionChart({
  items,
  title,
  emptyMessage,
}: {
  items: DistributionItem[];
  title: string;
  emptyMessage: string;
}) {
  const reduceMotion = useReducedMotion();
  const ranked = [...items].sort(
    (left, right) => right.count - left.count || left.type.localeCompare(right.type),
  );
  const total = ranked.reduce((sum, item) => sum + item.count, 0);
  const maximum = Math.max(1, ...ranked.map((item) => item.count));

  return (
    <figure className="type-distribution-chart">
      <figcaption>{title}</figcaption>
      {total === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <>
          <div className="type-chart-bars" aria-hidden="true">
            {ranked.map((item, index) => (
              <div className="type-chart-row" key={item.type}>
                <span className="type-chart-label">{item.type}</span>
                <span className="type-chart-track">
                  <motion.span
                    className="type-chart-fill"
                    data-type={item.type}
                    initial={{ scaleX: reduceMotion ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.45,
                      delay: reduceMotion ? 0 : index * 0.06,
                      ease: "easeOut",
                    }}
                    style={{
                      inlineSize: `${Math.max(4, (item.count / maximum) * 100)}%`,
                      transformOrigin: "left center",
                    }}
                  />
                </span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">File type</th>
                <th scope="col">Files</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item) => (
                <tr key={item.type}>
                  <th scope="row">{item.type}</th>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
