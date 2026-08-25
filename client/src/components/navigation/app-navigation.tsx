"use client";
import type { AccessSession } from "@gold-era/contracts/public";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { LogoutButton } from "../auth/logout-button";
import { FileoraBrand } from "../brand/fileora-brand";
import { Drawer } from "../overlays/overlay";
import { ThemeSelector } from "../theme/theme-selector";
import { IconButton } from "../ui/controls";
import {
  ActivityIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  LockIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  type FileoraIconProps,
} from "../ui/icons";
import { Avatar } from "../ui/surfaces";

type UserRole = AccessSession["user"]["role"];

type NavigationProps = {
  role: UserRole;
  profile?: { name: string; email: string };
  storage?: { usedBytes: number; limitBytes: number };
};

const workspaceLinks = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/files", label: "Files", icon: FolderIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

const adminLinks = [
  { href: "/admin", label: "Platform", icon: ShieldIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/files", label: "Global files", icon: FileIcon },
  { href: "/admin/audit", label: "Audit history", icon: ActivityIcon },
] as const;

/** Formats a storage byte count without changing the server's exact accounting value. */
function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Renders persistent desktop and focus-safe compact navigation for an authenticated role. */
export function AppNavigation({ role, profile, storage }: NavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const percentage = useMemo(
    /** Derives a bounded presentation percentage from exact byte values. */ () =>
      storage && storage.limitBytes > 0
        ? Math.min(
            100,
            Math.round((storage.usedBytes / storage.limitBytes) * 100),
          )
        : 0,
    [storage],
  );

  useEffect(
    /** Closes compact navigation after a completed client-side route change. */ () => {
      setMenuOpen(false);
    },
    [pathname],
  );

  useEffect(
    /** Supports Escape dismissal when keyboard events originate outside the drawer panel. */ () => {
      if (!menuOpen) return;
      /** Closes the compact drawer from the global Escape boundary. */
      const closeOnEscape = (event: globalThis.KeyboardEvent) => {
        if (event.key === "Escape") setMenuOpen(false);
      };
      document.addEventListener("keydown", closeOnEscape);
      return () => document.removeEventListener("keydown", closeOnEscape);
    },
    [menuOpen],
  );

  useEffect(
    /** Closes an obsolete compact drawer when resizing into the persistent shell. */ () => {
      if (typeof window.matchMedia !== "function") return;
      const media = window.matchMedia("(min-width: 821px)");
      /** Applies the desktop boundary without moving focus to a hidden control. */
      const closeAtDesktop = () => {
        if (media.matches) setMenuOpen(false);
      };
      closeAtDesktop();
      media.addEventListener("change", closeAtDesktop);
      return () => media.removeEventListener("change", closeAtDesktop);
    },
    [],
  );

  /** Builds one active-route-aware navigation link that closes the compact drawer. */
  const navigationLink = (
    href: string,
    label: string,
    DestinationIcon: ComponentType<FileoraIconProps>,
  ) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      onClick={
        /** Closes navigation after activating this destination. */ () =>
          setMenuOpen(false)
      }
    >
      <DestinationIcon />
      <span>{label}</span>
    </Link>
  );

  /** Renders role-aware navigation groups with the restricted administrator cue. */
  const navigationGroups = (label: string) => (
    <nav aria-label={label} data-compact-at="820">
      <span className="nav-label">Workspace</span>
      <div className="nav-links">
        {workspaceLinks.map(
          /** Maps one stable workspace destination. */ (item) => (
            <span key={item.href}>
              {navigationLink(item.href, item.label, item.icon)}
            </span>
          ),
        )}
      </div>
      {role === "ADMIN" ? (
        <section
          className="admin-nav-group"
          aria-label="Restricted administration"
        >
          <span className="nav-label">Administration</span>
          <p className="restricted">
            <LockIcon /> Restricted access
          </p>
          <div className="nav-links">
            {adminLinks.map(
              /** Maps one server-restricted administrator destination. */ (
                item,
              ) => (
                <span key={item.href}>
                  {navigationLink(item.href, item.label, item.icon)}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}
    </nav>
  );

  /** Renders exact storage progress and safe profile identity in the shell footer. */
  const accountSummary = () => (
    <div className="sidebar-account">
      {storage ? (
        <section className="storage-summary" aria-label="Storage usage">
          <div>
            <span>{formatStorage(storage.usedBytes)} used</span>
            <span>{formatStorage(storage.limitBytes)}</span>
          </div>
          <progress value={storage.usedBytes} max={storage.limitBytes}>
            {percentage}%
          </progress>
          <small>{percentage}% used</small>
        </section>
      ) : (
        <Link className="storage-link" href="/dashboard">
          View storage usage
        </Link>
      )}
      {profile ? (
        <Link className="profile-summary" href="/profile">
          <Avatar name={profile.name} />
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.email}</small>
          </span>
        </Link>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="app-sidebar" aria-label="Application sidebar">
        <FileoraBrand href="/dashboard" tagline />
        {navigationGroups("Primary")}
        {accountSummary()}
      </aside>
      <header className="app-topbar">
        <IconButton
          ref={triggerRef}
          className="mobile-nav-trigger"
          label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={
            /** Preserves the opener as the compact drawer's focus-restoration target. */ () => {
              triggerRef.current?.focus();
              setMenuOpen(true);
            }
          }
        >
          <MenuIcon />
        </IconButton>
        <div className="topbar-actions">
          <ThemeSelector />
          <LogoutButton />
        </div>
      </header>
      <Drawer
        open={menuOpen}
        title="Navigate"
        onClose={
          /** Closes compact navigation from Escape or a safe backdrop. */ () =>
            setMenuOpen(false)
        }
        backdropTestId="navigation-backdrop"
      >
        <div className="compact-navigation">
          <IconButton
            className="compact-navigation-close"
            label="Close navigation"
            onClick={
              /** Closes the compact navigation from its explicit action. */ () =>
                setMenuOpen(false)
            }
          >
            ×
          </IconButton>
          <FileoraBrand href="/dashboard" tagline />
          {navigationGroups("Mobile primary")}
          {accountSummary()}
          <div className="compact-account-actions">
            <ThemeSelector />
            <LogoutButton />
          </div>
        </div>
      </Drawer>
    </>
  );
}
