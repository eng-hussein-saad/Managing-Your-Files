"use client";
import { ErrorPanel } from "../../components/status/error-panel";
/** Presents recoverable errors inside public authentication routes. */
export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="auth-page">
      <ErrorPanel
        message="The authentication page could not be displayed."
        retry={reset}
      />
    </main>
  );
}
