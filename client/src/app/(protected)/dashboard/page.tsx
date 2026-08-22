"use client";
import Link from "next/link";
import { useAuthState } from "../../../features/auth/auth-store";
import { useFileStatistics } from "../../../features/dashboard/hooks/use-file-statistics";
import { FileStatistics } from "../../../features/dashboard/components/file-statistics";
/** Welcomes the authenticated user into the protected product foundation. */
export default function DashboardPage() {
  const auth = useAuthState();
  const statistics = useFileStatistics();
  return (
    <main id="main" className="dashboard app-page">
      <header className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">Private archive</span>
          <h1>Good to see you, {auth.session?.user.name}.</h1>
          <p>A quiet overview of everything you have kept safe.</p>
        </div>
        <Link className="button" href="/files">Open your files <span aria-hidden="true">→</span></Link>
      </header>
      {statistics.isLoading ? (
        <section className="dashboard-skeleton" aria-label="Loading file activity" aria-busy="true"><span /><span /><span /></section>
      ) : null}
      {statistics.isError ? (
        <div className="inline-state error-state" role="alert">
          <div><strong>Activity is taking longer than expected.</strong><p>Your files are safe. Try loading the overview again.</p></div>
          <button className="button secondary" type="button" onClick={() => void statistics.refetch()}>Retry</button>
        </div>
      ) : null}
      {statistics.data ? <FileStatistics data={statistics.data} /> : null}
    </main>
  );
}
