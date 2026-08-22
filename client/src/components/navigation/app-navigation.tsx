"use client";
import type { AccessSession } from "@gold-era/contracts/public";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { LogoutButton } from "../auth/logout-button";

type UserRole = AccessSession["user"]["role"];

/** Renders the shared authenticated navigation with role-specific additions. */
export function AppNavigation({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </Link>
  );
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="brand" href="/dashboard">Gold Era<span>.</span></Link>
        <nav className="desktop-nav" aria-label="Account">
          {role === "ADMIN" ? link("/admin", "Admin") : null}
          {link("/dashboard", "Overview")}
          {link("/files", "Files")}
          {link("/profile", "Profile")}
        </nav>
        <div className="app-header-actions">
          <LogoutButton />
          <button
            className="mobile-nav-trigger"
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </div>
      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <div
          className="mobile-nav-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <aside
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            <div className="mobile-nav-drawer-header">
              <div>
                <span className="eyebrow">Gold Era</span>
                <h2 id="mobile-nav-title">Navigate</h2>
              </div>
              <button
                className="drawer-close"
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <nav aria-label="Mobile account navigation">
              {role === "ADMIN" ? link("/admin", "Admin") : null}
              {link("/dashboard", "Overview")}
              {link("/files", "Files")}
              {link("/profile", "Profile")}
            </nav>
          </aside>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
