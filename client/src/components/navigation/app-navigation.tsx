"use client";
import type { AccessSession } from "@gold-era/contracts/public";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../auth/logout-button";

type UserRole = AccessSession["user"]["role"];

/** Renders the shared authenticated navigation with role-specific additions. */
export function AppNavigation({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} aria-current={pathname === href ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="brand" href="/dashboard">Gold Era<span>.</span></Link>
        <nav aria-label="Account">
          {role === "ADMIN" ? link("/admin", "Admin") : null}
          {link("/dashboard", "Overview")}
          {link("/files", "Files")}
          {link("/profile", "Profile")}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
