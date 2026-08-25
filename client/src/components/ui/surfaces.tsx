import type { HTMLAttributes, ReactNode } from "react";
import { AlertIcon, CheckIcon } from "./icons";

/** Wraps related content in the shared bordered surface. */
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <article className={`ui-card ${className}`.trim()} {...props} />;
}

/** Displays one exact metric with a programmatic label and optional context. */
export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}) {
  const accessibleValue =
    typeof value === "string" || typeof value === "number"
      ? `${value}`
      : "value";
  return (
    <section className="ui-metric">
      <span>{label}</span>
      <strong aria-label={`${label}: ${accessibleValue}`}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </section>
  );
}

const toneCues = {
  neutral: "•",
  success: "✓",
  warning: "!",
  danger: "!",
  info: "i",
} as const;

/** Displays a compact state with a non-color-only text cue. */
export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof toneCues;
  children: ReactNode;
}) {
  return (
    <span className={`ui-pill ${tone}`}>
      <span aria-hidden="true">{toneCues[tone]}</span> {children}
    </span>
  );
}

/** Produces stable initials for the shared profile avatar. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      /** Selects the first visible character from one name segment. */ (
        part,
      ) => part[0]?.toUpperCase() ?? "",
    )
    .join("");
}

/** Displays a person's derived initials without exposing additional identity data. */
export function Avatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={`ui-avatar ${className}`.trim()} aria-label={name}>
      {initials(name)}
    </span>
  );
}

/** Announces a loading placeholder while preserving its semantic purpose. */
export function Skeleton({
  label,
  lines = 3,
}: {
  label: string;
  lines?: number;
}) {
  return (
    <span
      className="ui-skeleton"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from(
        { length: lines },
        /** Produces one decorative loading line. */ (_value, index) => (
          <i key={index} aria-hidden="true" />
        ),
      )}
    </span>
  );
}

/** Presents an empty collection state with a concise recovery action. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ui-empty-state" role="status" aria-label={title}>
      <span aria-hidden="true">+</span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </section>
  );
}

/** Presents a load failure with an alert cue and optional retry action. */
export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ui-error-state" role="alert" aria-label={title}>
      <AlertIcon />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </section>
  );
}

/** Announces compact informational, success, warning, or failure feedback. */
export function Status({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const liveRole = tone === "danger" ? "alert" : "status";
  return (
    <p className={`ui-status ${tone}`} role={liveRole}>
      {tone === "success" ? <CheckIcon /> : <AlertIcon />}
      <span>
        {tone === "warning" || tone === "danger" ? (
          <span aria-hidden="true">! </span>
        ) : null}
        {children}
      </span>
    </p>
  );
}
