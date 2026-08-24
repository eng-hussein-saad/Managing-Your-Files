import Link from "next/link";

/** Renders the shared Fileora product identity and optional approved tagline. */
export function FileoraBrand({ href = "/", tagline = false, className = "brand" }: { href?: string; tagline?: boolean; className?: string }) {
  return <span className="fileora-identity"><Link className={className} href={href}>Fileora<span>.</span></Link>{tagline ? <small>Your files. Organized your way.</small> : null}</span>;
}
