"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type ToastKind = "info" | "success" | "error";

interface ToastOptions {
  kind?: ToastKind;
  duration?: number;
}

interface ToastMessage extends Required<ToastOptions> {
  id: number;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

/** Renders one dismissible notification and removes it after its duration. */
function ToastItem({
  toast,
  dismiss,
}: {
  toast: ToastMessage;
  dismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timeout = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.duration, toast.id]);

  return (
    <div
      className={`toast ${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
      aria-atomic="true"
    >
      <span className="toast-mark" aria-hidden="true" />
      <p>{toast.message}</p>
      <button
        className="toast-dismiss"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

/** Provides a stable app-wide notification queue across client-side routes. */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const notify = useCallback((message: string, options: ToastOptions = {}) => {
    const id = ++nextToastId;
    setToasts((current) => [
      ...current.slice(-3),
      {
        id,
        message,
        kind: options.kind ?? "info",
        duration: options.duration ?? 4500,
      },
    ]);
    return id;
  }, []);
  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <aside className="toast-region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

/** Returns the notification controls supplied by the root toast provider. */
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}
