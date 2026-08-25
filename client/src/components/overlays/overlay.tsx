"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type OverlayProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  backdropTestId?: string;
  kind: "dialog" | "drawer";
};

/** Returns the enabled controls that participate in overlay focus containment. */
function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-autofocus],button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])",
    ),
  ).filter(
    /** Excludes elements hidden from layout and assistive navigation. */ (
      element,
    ) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

/** Implements shared modal labeling, dismissal, background isolation, and focus lifecycle. */
function Overlay({
  open,
  title,
  description,
  children,
  onClose,
  dismissible = true,
  backdropTestId = "overlay-backdrop",
  kind,
}: OverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  if (typeof document !== "undefined" && open && !wasOpenRef.current) {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  wasOpenRef.current = open;

  useEffect(
    /** Owns a connected portal host across React Strict Mode effect replays. */ () => {
      const root = document.createElement("div");
      root.dataset.overlayRoot = kind;
      document.body.append(root);
      setPortalRoot(root);
      return /** Removes only the host created by this effect pass. */ () =>
        root.remove();
    },
    [kind],
  );

  useEffect(
    /** Isolates the page and restores its exact prior state around an open modal. */ () => {
      if (!open || !portalRoot) return;
      if (!openerRef.current)
        openerRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      const previousOverflow = document.body.style.overflow;
      const background = Array.from(document.body.children).filter(
        /** Keeps the active portal interactive while isolating every background sibling. */ (
          element,
        ) => element !== portalRoot,
      );
      const previous = background.map(
        /** Captures attributes so nested overlays and existing inert state restore safely. */ (
          element,
        ) => ({
          element,
          inert: element.hasAttribute("inert"),
          ariaHidden: element.getAttribute("aria-hidden"),
        }),
      );
      document.body.style.overflow = "hidden";
      for (const element of background) {
        element.setAttribute("inert", "");
        element.setAttribute("aria-hidden", "true");
      }
      focusableElements(panelRef.current ?? document.body)[0]?.focus();
      return /** Restores background access, scroll position policy, and the original opener. */ () => {
        document.body.style.overflow = previousOverflow;
        for (const state of previous) {
          if (!state.inert) state.element.removeAttribute("inert");
          if (state.ariaHidden === null)
            state.element.removeAttribute("aria-hidden");
          else state.element.setAttribute("aria-hidden", state.ariaHidden);
        }
        const opener = openerRef.current;
        opener?.focus();
        queueMicrotask(
          /** Stabilizes focus after the closing React commit without stealing it during an effect replay. */ () => {
            if (!panelRef.current?.isConnected) opener?.focus();
          },
        );
      };
    },
    [open, portalRoot],
  );

  /** Contains Tab navigation and provides safe Escape dismissal. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && dismissible) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const controls = focusableElements(panelRef.current);
    if (!controls.length) {
      event.preventDefault();
      panelRef.current.focus();
      return;
    }
    const first = controls[0]!;
    const last = controls[controls.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /** Dismisses only a direct, safe backdrop interaction. */
  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (dismissible && event.target === event.currentTarget) onClose();
  };

  if (!open || !portalRoot) return null;
  return createPortal(
    <div
      className={`ui-overlay-backdrop ${kind}`}
      data-testid={backdropTestId}
      onMouseDown={handleBackdrop}
    >
      <div
        ref={panelRef}
        className={`ui-overlay-panel ${kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descriptionId}>{description}</p> : null}
        {children}
      </div>
    </div>,
    portalRoot,
  );
}

/** Renders a centered modal dialog on the shared overlay foundation. */
export function Dialog(props: Omit<OverlayProps, "kind">) {
  return <Overlay {...props} kind="dialog" />;
}

/** Renders a responsive right-side drawer on the shared overlay foundation. */
export function Drawer(props: Omit<OverlayProps, "kind">) {
  return <Overlay {...props} kind="drawer" />;
}
