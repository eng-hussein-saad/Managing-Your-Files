import type { ReactNode } from "react";
/** Presents a focusable full-page loading, empty, unauthorized, forbidden, or failure state. */
export function PageState({
  title,
  children,
  busy = false,
}: {
  title: string;
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <main className="page-state" aria-busy={busy}>
      <section className="status-card" tabIndex={-1}>
        <span className="eyebrow">Gold Era</span>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
