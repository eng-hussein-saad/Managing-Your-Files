import type { ReactNode } from "react";
import { Card } from "../ui/surfaces";
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
      <Card
        className={`status-card ${tone}${busy ? " busy" : ""}`}
        tabIndex={-1}
        role={busy ? undefined : tone === "error" ? "alert" : "status"}
      >
        {busy ? (
          <div className="page-state-loading" role="status" aria-label={title}>
            <span className="page-state-spinner" aria-hidden="true" />
            <h1>{title}</h1>
            {children}
          </div>
        ) : (
          <>
            <span className="eyebrow">Fileora</span>
            <h1>{title}</h1>
            {children}
          </>
        )}
      </Card>
    </main>
  );
}
