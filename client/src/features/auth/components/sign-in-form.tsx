"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "../../../components/auth/auth-form";
import { FormStatus } from "../../../components/auth/form-status";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useSignIn } from "../hooks/use-sign-in";
/** Authenticates a verified user through the same-origin credential gateway. */
export function SignInForm() {
  const signIn = useSignIn();
  const router = useRouter();
  const search = useSearchParams();
  const [values, setValues] = useState({ email: "", password: "" });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    signIn.mutate(values, {
      onSuccess: (session) =>
        router.replace(session.user.role === "ADMIN" ? "/admin" : "/dashboard"),
      onError: (error) => {
        if (apiErrorCode(error) === "AUTH_VERIFICATION_REQUIRED")
          router.push(
            `/verify-email?email=${encodeURIComponent(values.email)}`,
          );
      },
    });
  };
  return (
    <AuthForm onSubmit={submit}>
      <div>
        <span className="eyebrow">Welcome back</span>
        <h1>Return to your archive</h1>
        <p className="lede">
          Continue where you left off, with your session protected by
          short-lived access.
        </p>
      </div>
      {search.get("verified") ? (
        <FormStatus
          kind="success"
          message="Email verified. You can sign in now."
        />
      ) : null}
      <label>
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) =>
            setValues({ ...values, email: event.target.value })
          }
        />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) =>
            setValues({ ...values, password: event.target.value })
          }
        />
      </label>
      <FormStatus
        kind="error"
        message={signIn.error ? apiErrorMessage(signIn.error) : undefined}
      />
      <button className="button" disabled={signIn.isPending}>
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </button>
      <p className="switch">
        New here? <a href="/register">Create an account</a>
      </p>
    </AuthForm>
  );
}
