import type { PropsWithChildren } from "react";
import { GuestRoute } from "../../components/auth/guest-route";
import { FileoraBrand } from "../../components/brand/fileora-brand";
import { ThemeSelector } from "../../components/theme/theme-selector";

/** Applies the approved split story and focused account-access surface. */
export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <GuestRoute>
      <div className="auth-shell">
        <aside className="auth-story" aria-label="About Fileora">
          <FileoraBrand />
          <div>
            <span className="eyebrow">A calm place for what matters</span>
            <h2>Your files. Organized your way.</h2>
            <p>
              A private, resilient archive with precise controls and no clutter
              around the work.
            </p>
          </div>
          <small>© 2026 Fileora · Secure file management</small>
        </aside>
        <section className="auth-form-shell" aria-label="Account access">
          <div className="auth-theme">
            <ThemeSelector />
          </div>
          {children}
        </section>
      </div>
    </GuestRoute>
  );
}
