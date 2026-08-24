import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AppProviders } from "../providers/app-providers";
import "./globals.css";
import { ThemeScript } from "../components/theme/theme-script";
export const metadata: Metadata = {
  title: { default: "Fileora", template: "%s | Fileora" },
  description: "Your files. Organized your way.",
};
/** Provides the document shell, accessible skip link, and application services. */
export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
