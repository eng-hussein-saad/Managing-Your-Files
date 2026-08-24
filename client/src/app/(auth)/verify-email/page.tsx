import { Suspense } from "react";
import { VerifyEmailForm } from "../../../features/auth/components/verify-email-form";
/** Renders verification and resend recovery behind a search-parameter boundary. */
export default function VerifyEmailPage() {
  return (
    <main id="main" className="auth-page">
      <Suspense fallback={<p>Loading verification…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
