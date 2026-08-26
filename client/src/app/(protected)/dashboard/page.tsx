"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthState } from "../../../features/auth/auth-store";
import { useFileStatistics } from "../../../features/dashboard/hooks/use-file-statistics";
import { FileStatistics } from "../../../features/dashboard/components/file-statistics";
import { ErrorState, Skeleton } from "../../../components/ui/surfaces";
import { FolderIcon } from "../../../components/ui/icons";
/** Welcomes the authenticated user into the protected product foundation. */
export default function DashboardPage() {
  const auth = useAuthState();
  const statistics = useFileStatistics();
  const reduceMotion = useReducedMotion();
  return (
    <main id="main" className="dashboard app-page">
      <motion.header
        className="page-heading dashboard-heading"
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
      >
        <div>
          <span className="eyebrow">Personal overview</span>
          <h1>Good to see you, {auth.session?.user.name}.</h1>
          <p>A clear view of your archive across the last 30 days.</p>
        </div>
        <Link className="ui-button primary" href="/files">
          <FolderIcon />
          Open your files
        </Link>
      </motion.header>
      {statistics.isLoading ? (
        <section className="dashboard-skeleton">
          <Skeleton label="Loading file activity" lines={3} />
        </section>
      ) : null}
      {statistics.isError ? (
        <ErrorState
          title="Activity is taking longer than expected."
          description="Your files are safe. Try loading the overview again."
          action={
            <button
              className="ui-button secondary"
              type="button"
              onClick={() => void statistics.refetch()}
            >
              Retry
            </button>
          }
        />
      ) : null}
      {statistics.data ? <FileStatistics data={statistics.data} /> : null}
    </main>
  );
}
