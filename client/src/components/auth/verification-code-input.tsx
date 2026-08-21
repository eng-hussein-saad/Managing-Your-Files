import type { InputHTMLAttributes } from "react";
/** Renders the numeric one-time-code input with autocomplete and mobile keypad hints. */
export function VerificationCodeInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      aria-label="Eight-digit verification code"
      autoComplete="one-time-code"
      inputMode="numeric"
      pattern="[0-9]{8}"
      maxLength={8}
      className="code-input"
    />
  );
}
