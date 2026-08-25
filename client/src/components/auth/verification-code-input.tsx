import type { FormEvent, InputHTMLAttributes } from "react";
/** Renders the numeric one-time-code input with autocomplete and mobile keypad hints. */
export function VerificationCodeInput({
  onInput,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  /** Normalizes pasted and typed proof to the API's eight numeric characters. */
  const normalize = (event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value
      .replace(/\D/g, "")
      .slice(0, 8);
    onInput?.(event);
  };
  return (
    <input
      {...props}
      onInput={normalize}
      aria-label="Eight-digit verification code"
      autoComplete="one-time-code"
      inputMode="numeric"
      pattern="[0-9]{8}"
      maxLength={8}
      className="code-input"
    />
  );
}
