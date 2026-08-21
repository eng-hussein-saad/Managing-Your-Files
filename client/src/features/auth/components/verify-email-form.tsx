"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "../../../components/auth/auth-form";
import { FormStatus } from "../../../components/auth/form-status";
import { VerificationCodeInput } from "../../../components/auth/verification-code-input";
import { apiErrorMessage } from "../../../lib/api/api-error";
import {
  useResendVerification,
  useVerifyEmail,
} from "../hooks/use-registration";
/** Handles verification, superseded-code feedback, resend, and successful transition. */
export function VerifyEmailForm() {
  const search = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [code, setCode] = useState("");
  const verification = useVerifyEmail();
  const resend = useResendVerification();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    verification.mutate(
      { email, code },
      {
        onSuccess: () =>
          window.setTimeout(() => router.replace("/login?verified=true"), 700),
      },
    );
  };
  return (
    <AuthForm onSubmit={submit}>
      <div>
        <span className="eyebrow">One final step</span>
        <h1>Check your inbox</h1>
        <p className="lede">
          Enter the eight-digit code we sent. It remains valid for ten minutes.
        </p>
      </div>
      {search.get("delivery") === "pending" ? (
        <FormStatus
          kind="info"
          message="Your account was created, but the first message could not be delivered. Wait one minute, then request a new code below."
        />
      ) : null}
      <label>
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Verification code
        <VerificationCodeInput
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
      </label>
      <FormStatus
        kind={verification.isSuccess ? "success" : "error"}
        message={
          verification.isSuccess
            ? "Verified. Taking you to sign in…"
            : verification.error
              ? apiErrorMessage(verification.error)
              : undefined
        }
      />
      <button className="button" disabled={verification.isPending}>
        {verification.isPending ? "Verifying…" : "Verify email"}
      </button>
      <button
        className="text-button"
        type="button"
        disabled={resend.isPending || !email}
        onClick={() => resend.mutate(email)}
      >
        {resend.isPending ? "Sending…" : "Send a new code"}
      </button>
      <FormStatus
        message={
          resend.isSuccess
            ? resend.data.message
            : resend.error
              ? apiErrorMessage(resend.error)
              : undefined
        }
        kind={resend.error ? "error" : "info"}
      />
    </AuthForm>
  );
}
