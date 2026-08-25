import type { ReactNode } from "react";

/** Renders the administrator page heading. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <header className="page-heading admin-page-heading">
        <div>
          <span className="eyebrow">Platform administration</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions}
      </header>
    </>
  );
}
