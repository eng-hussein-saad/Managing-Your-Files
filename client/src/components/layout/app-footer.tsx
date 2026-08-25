import { FileoraBrand } from "../brand/fileora-brand";

/** Provides a responsive normal-flow product footer without obstructing content. */
export function AppFooter() {
  return (
    <footer className="app-footer">
      <FileoraBrand tagline />
      <p>© 2026 Fileora · Secure file management</p>
    </footer>
  );
}
