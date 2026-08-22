"use client";
import { useAuthState } from "../../../features/auth/auth-store";
import { useFileStatistics } from "../../../features/dashboard/hooks/use-file-statistics";
import { FileStatistics } from "../../../features/dashboard/components/file-statistics";
/** Welcomes the authenticated user into the protected product foundation. */
export default function DashboardPage() {
  const auth = useAuthState();
  const statistics = useFileStatistics();
  return (
    <main id="main" className="dashboard">
      <span className="eyebrow">Your archive</span>
      <h1>Good to see you, {auth.session?.user.name}.</h1>
      {statistics.isLoading ? <p>Loading file activity…</p> : null}
      {statistics.isError ? (
        <button type="button" onClick={() => void statistics.refetch()}>
          Retry file activity
        </button>
      ) : null}
      {statistics.data ? <FileStatistics data={statistics.data} /> : null}
    </main>
  );
}
