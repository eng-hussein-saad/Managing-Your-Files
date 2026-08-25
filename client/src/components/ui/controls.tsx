import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { SearchIcon } from "./icons";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
};

/** Renders a token-backed text button with an explicit busy state. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      busy = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`ui-button ${variant} ${className}`.trim()}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        {...props}
      >
        {children}
      </button>
    );
  },
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

/** Renders a 44 px standalone icon action with its accessible name enforced. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className = "", children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`ui-icon-button ${className}`.trim()}
        aria-label={label}
        {...props}
      >
        {children}
      </button>
    );
  },
);

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  help?: string;
  error?: string;
};

/** Associates a native input with its visible label, help, and validation message. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, help, error, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy =
    [help ? `${inputId}-help` : null, error ? `${inputId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <span className={`ui-field ${className}`.trim()}>
      <label className="ui-field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {help ? <small id={`${inputId}-help`}>{help}</small> : null}
      {error ? (
        <small id={`${inputId}-error`} className="ui-field-error" role="alert">
          {error}
        </small>
      ) : null}
    </span>
  );
});

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  help?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

/** Associates a native select with visible guidance and typed options. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, help, error, options, id, className = "", ...props },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedBy =
      [help ? `${selectId}-help` : null, error ? `${selectId}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <span className={`ui-field ${className}`.trim()}>
        <label className="ui-field-label" htmlFor={selectId}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map(
            /** Maps one typed option into its native representation. */ (
              option,
            ) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
        {help ? <small id={`${selectId}-help`}>{help}</small> : null}
        {error ? (
          <small
            id={`${selectId}-error`}
            className="ui-field-error"
            role="alert"
          >
            {error}
          </small>
        ) : null}
      </span>
    );
  },
);

/** Renders a labeled search input with a decorative search cue. */
export const SearchField = forwardRef<HTMLInputElement, FieldProps>(
  function SearchField({ label, className = "", ...props }, ref) {
    return (
      <span className={`ui-search-field ${className}`.trim()}>
        <SearchIcon />
        <Field ref={ref} type="search" label={label} {...props} />
      </span>
    );
  },
);

/** Arranges labeled controls and actions into the shared responsive form rhythm. */
export function FormLayout({
  children,
  className = "",
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={`ui-form-layout ${className}`.trim()} {...props}>
      {children}
    </form>
  );
}
