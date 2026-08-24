import { FileoraBrand } from "../brand/fileora-brand";

/** Provides a responsive normal-flow product footer without obstructing content. */
export function AppFooter() {
  return <footer className="app-footer"><FileoraBrand tagline /><p>Private file organization with server-enforced access.</p></footer>;
}
