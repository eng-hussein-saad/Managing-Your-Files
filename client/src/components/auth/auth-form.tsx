import type { FormHTMLAttributes, PropsWithChildren } from "react";
/** Provides the consistent accessible card and form semantics for authentication. */
export function AuthForm({
  children,
  ...props
}: PropsWithChildren<FormHTMLAttributes<HTMLFormElement>>) {
  return (
    <form className="auth-card ui-form-layout" {...props}>
      {children}
    </form>
  );
}
