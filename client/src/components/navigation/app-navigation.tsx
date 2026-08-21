"use client";
import type { AccessSession } from "@gold-era/contracts/public";
import Link from "next/link";
import { LogoutButton } from "../auth/logout-button";

type UserRole = AccessSession["user"]["role"];

/** Renders the shared authenticated navigation with role-specific additions. */
export function AppNavigation({ role }: { role: UserRole }) {
  return (
    <header className="app-header">
      <Link className="brand" href="/dashboard">
        Gold Era<span>.</span>
      </Link>
      <nav aria-label="Account">
        {role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
