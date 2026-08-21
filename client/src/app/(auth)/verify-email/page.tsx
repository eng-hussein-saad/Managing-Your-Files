import { Suspense } from "react";
import { VerifyEmailForm } from "../../../features/auth/components/verify-email-form";
/** Renders verification and resend recovery behind a search-parameter boundary. */
export default function VerifyEmailPage() {
  return (
    <main id="main" className="auth-page">
      <a className="brand corner" href="/">
        Gold Era<span>.</span>
      </a>
      <Suspense fallback={<p>Loading verification…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
