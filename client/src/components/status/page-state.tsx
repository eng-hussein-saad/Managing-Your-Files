import type { ReactNode } from "react";
import { Card, Skeleton } from "../ui/surfaces";
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
        className={`status-card ${tone}`}
        tabIndex={-1}
        role={busy ? undefined : tone === "error" ? "alert" : "status"}
      >
        {busy ? (
          <Skeleton label={title} lines={4} />
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
