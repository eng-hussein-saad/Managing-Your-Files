import Link from "next/link";
import { FolderIcon } from "../ui/icons";

/** Renders the shared Fileora product identity and optional approved tagline. */
export function FileoraBrand({
  href = "/",
  tagline = false,
  className = "brand",
}: {
  href?: string;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span className="fileora-identity">
      <Link className={className} href={href}>
        <span className="brand-mark" aria-hidden="true">
          <FolderIcon />
        </span>
        <span>Fileora</span>
      </Link>
      {tagline ? <small>Your files. Organized your way.</small> : null}
    </span>
  );
}
