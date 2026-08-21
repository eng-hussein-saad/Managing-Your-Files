"use client";
import { ErrorPanel } from "../../components/status/error-panel";
/** Presents recoverable errors inside administrator routes. */
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="dashboard">
      <ErrorPanel
        message="The administrator area could not be displayed."
        retry={reset}
      />
    </main>
  );
}
