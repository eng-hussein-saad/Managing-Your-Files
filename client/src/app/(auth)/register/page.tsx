import { RegisterForm } from "../../../features/auth/components/register-form";
/** Renders the accessible account registration journey. */
export default function RegisterPage() {
  return (
    <main id="main" className="auth-page">
      <a className="brand corner" href="/">
        Gold Era<span>.</span>
      </a>
      <RegisterForm />
    </main>
  );
}
