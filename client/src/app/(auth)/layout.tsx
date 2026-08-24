import type { PropsWithChildren } from "react";
import { FileoraBrand } from "../../components/brand/fileora-brand";
import { AppFooter } from "../../components/layout/app-footer";
import { ThemeSelector } from "../../components/theme/theme-selector";

/** Applies the shared Fileora identity, theme control, and footer to authentication. */
export default function AuthLayout({ children }: PropsWithChildren) {
  return <div className="app-shell"><header className="auth-shell-header"><FileoraBrand tagline /><ThemeSelector /></header>{children}<AppFooter /></div>;
}
