import type { ReactNode } from "react";
/** Presents a focusable full-page loading, empty, unauthorized, forbidden, or failure state. */
export function PageState({
  title,
  children,
  busy = false,
  tone = "neutral",
}: {
  title: string;
  children?: ReactNode;
  busy?: boolean;
  tone?: "neutral" | "empty" | "success" | "error";
}) {
  return (
    <main className="page-state" aria-busy={busy}>
      <section className={`status-card ${tone}`} tabIndex={-1} role={tone === "error" ? "alert" : "status"}>
        <span className="eyebrow">Fileora</span>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
