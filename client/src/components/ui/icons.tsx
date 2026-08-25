import { useId, type ReactNode, type SVGProps } from "react";

export type FileoraIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  label?: string;
};

/** Supplies consistent sizing and accessible decorative or standalone icon semantics. */
function Icon({
  label,
  children,
  ...props
}: FileoraIconProps & { children: ReactNode }) {
  const titleId = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-labelledby={label ? titleId : undefined}
      role={label ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {label ? <title id={titleId}>{label}</title> : null}
      {children}
    </svg>
  );
}

/** Renders the product folder mark. */
export function FolderIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6.5h6l2 2H21v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 9h18" />
    </Icon>
  );
}

/** Renders a generic file symbol. */
export function FileIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5" />
    </Icon>
  );
}

/** Renders a magnifying-glass search cue. */
export function SearchIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </Icon>
  );
}

/** Renders the compact navigation menu cue. */
export function MenuIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

/** Renders a close cue for overlays. */
export function CloseIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

/** Renders a successful-status check cue. */
export function CheckIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}

/** Renders a warning/status cue. */
export function AlertIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  );
}

/** Renders the list presentation cue. */
export function ListIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </Icon>
  );
}

/** Renders the grid presentation cue. */
export function GridIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

/** Renders a previous-direction cue. */
export function ChevronLeftIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

/** Renders a next-direction cue. */
export function ChevronRightIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

/** Renders an upload cue. */
export function UploadIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </Icon>
  );
}

/** Renders a profile identity cue. */
export function UserIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  );
}

/** Renders a restricted-area lock cue. */
export function LockIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

/** Renders the overview destination cue from the approved reference. */
export function HomeIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" />
    </Icon>
  );
}

/** Renders the administrator platform cue from the approved reference. */
export function ShieldIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6z" />
    </Icon>
  );
}

/** Renders the administrator user-directory cue. */
export function UsersIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.7M16 3.2a4 4 0 0 1 0 7.6" />
    </Icon>
  );
}

/** Renders the audit activity cue. */
export function ActivityIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2.3-7 4.4 14 2.3-7h5" />
    </Icon>
  );
}

/** Renders the sign-out action cue. */
export function LogoutIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M10 17l5-5-5-5M15 12H3M15 5h5v14h-5" />
    </Icon>
  );
}

/** Renders the light appearance cue. */
export function SunIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

/** Renders the dark appearance cue. */
export function MoonIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M20 15a8 8 0 1 1-11-11 7 7 0 0 0 11 11" />
    </Icon>
  );
}

/** Renders the system appearance cue. */
export function MonitorIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  );
}

/** Renders the file-filter action cue. */
export function FilterIcon(props: FileoraIconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5h16l-6 7v5l-4 2v-7z" />
    </Icon>
  );
}
