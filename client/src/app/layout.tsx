import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AppProviders } from "../providers/app-providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "Gold Era",
  description: "A secure home for the work worth keeping.",
};
/** Provides the document shell, accessible skip link, and application services. */
export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
