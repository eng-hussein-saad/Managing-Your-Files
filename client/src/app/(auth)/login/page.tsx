import { Suspense } from "react";
import { SignInForm } from "../../../features/auth/components/sign-in-form";
/** Renders verified-user sign-in with verification-success feedback. */
export default function LoginPage() {
  return (
    <main id="main" className="auth-page">
      <a className="brand corner" href="/">
        Gold Era<span>.</span>
      </a>
      <Suspense fallback={<p>Loading sign in…</p>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
