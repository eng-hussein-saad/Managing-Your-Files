import { Suspense } from "react";
import { SignInForm } from "../../../features/auth/components/sign-in-form";
import { Skeleton } from "../../../components/ui/surfaces";
/** Renders verified-user sign-in with verification-success feedback. */
export default function LoginPage() {
  return (
    <main id="main" className="auth-page">
      <Suspense fallback={<Skeleton label="Loading sign in" lines={6} />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
