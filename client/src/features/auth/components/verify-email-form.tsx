"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "../../../components/auth/auth-form";
import { FormStatus } from "../../../components/auth/form-status";
import { useToast } from "../../../components/toast/toast-provider";
import { VerificationCodeInput } from "../../../components/auth/verification-code-input";
import { Button, Field } from "../../../components/ui/controls";
import { apiErrorMessage } from "../../../lib/api/api-error";
import {
  useResendVerification,
  useVerifyEmail,
} from "../hooks/use-registration";
/** Handles verification, superseded-code feedback, resend, and successful transition. */
export function VerifyEmailForm() {
  const search = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [code, setCode] = useState("");
  const verification = useVerifyEmail();
  const resend = useResendVerification();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    verification.mutate(
      { email, code },
      {
        onSuccess: () => {
          window.setTimeout(() => {
            notify("Email verified. You can sign in now.", { kind: "success" });
            router.replace("/login");
          }, 700);
        },
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
      <Field
        label="Email"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label className="ui-field" htmlFor="verification-code">
        <span className="ui-field-label">Verification code</span>
        <VerificationCodeInput
          id="verification-code"
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
      <Button busy={verification.isPending}>
        {verification.isPending ? "Verifying…" : "Verify email"}
      </Button>
      <Button
        variant="ghost"
        type="button"
        disabled={resend.isPending || !email}
        onClick={() =>
          resend.mutate(email, {
            onSuccess: (result) => notify(result.message, { kind: "success" }),
          })
        }
      >
        {resend.isPending ? "Sending…" : "Send a new code"}
      </Button>
      <FormStatus
        message={resend.error ? apiErrorMessage(resend.error) : undefined}
        kind="error"
      />
    </AuthForm>
  );
}
