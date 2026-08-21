"use client";
import { ErrorPanel } from "../../components/status/error-panel";
/** Presents recoverable errors inside protected routes. */
export default function ProtectedError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="dashboard">
      <ErrorPanel
        message="This protected page could not be displayed."
        retry={reset}
      />
    </main>
  );
}
