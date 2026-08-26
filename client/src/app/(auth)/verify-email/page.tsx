import { Suspense } from "react";
import { VerifyEmailForm } from "../../../features/auth/components/verify-email-form";
import { Skeleton } from "../../../components/ui/surfaces";
/** Renders verification and resend recovery behind a search-parameter boundary. */
export default function VerifyEmailPage() {
  return (
    <main id="main" className="auth-page">
      <Suspense fallback={<Skeleton label="Loading verification" lines={6} />}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
