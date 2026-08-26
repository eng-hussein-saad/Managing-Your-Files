"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "../../../components/auth/auth-form";
import { FormStatus } from "../../../components/auth/form-status";
import { Button, Field } from "../../../components/ui/controls";
import { useToast } from "../../../components/toast/toast-provider";
import { apiErrorCode, apiErrorMessage } from "../../../lib/api/api-error";
import { useRegistration } from "../hooks/use-registration";
/** Captures registration fields and routes persisted accounts into verification. */
export function RegisterForm() {
  const registration = useRegistration();
  const router = useRouter();
  const { notify } = useToast();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const verificationUrl = (deliveryPending = false) =>
    `/verify-email?email=${encodeURIComponent(values.email)}&cooldown=60${deliveryPending ? "&delivery=pending" : ""}`;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    registration.mutate(values, {
      onSuccess: (result) => {
        notify("Account created. Check your email for the verification code.", {
          kind: "success",
        });
        router.push(
          `/verify-email?email=${encodeURIComponent(result.email)}&cooldown=60`,
        );
      },
      onError: (error) => {
        if (apiErrorCode(error) === "AUTH_VERIFICATION_DELIVERY_PENDING")
          router.push(verificationUrl(true));
      },
    });
  };
  return (
    <AuthForm onSubmit={submit}>
      <div>
        <span className="eyebrow">Begin your archive</span>
        <h1>Create your account</h1>
        <p className="lede">
          A secure place for the work, records, and ideas worth keeping.
        </p>
      </div>
      <Field
        label="Name"
        required
        maxLength={120}
        autoComplete="name"
        value={values.name}
        onChange={(event) => setValues({ ...values, name: event.target.value })}
      />
      <Field
        label="Email"
        required
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(event) =>
          setValues({ ...values, email: event.target.value })
        }
      />
      <Field
        label="Password"
        help="Use at least 8 characters"
        required
        minLength={8}
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) =>
          setValues({ ...values, password: event.target.value })
        }
      />
      <FormStatus
        kind="error"
        message={
          registration.error ? apiErrorMessage(registration.error) : undefined
        }
      />
      <Button busy={registration.isPending}>
        {registration.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="switch">
        Already verified? <a href="/login">Sign in</a>
      </p>
    </AuthForm>
  );
}
