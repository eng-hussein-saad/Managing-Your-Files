"use client";
import type { AccessSession } from "@gold-era/contracts/public";
import { useFileStatistics } from "../../features/dashboard/hooks/use-file-statistics";
import { AppNavigation } from "./app-navigation";

/** Connects authenticated identity and storage queries to the presentational shell. */
export function ConnectedAppNavigation({
  session,
}: {
  session: AccessSession;
}) {
  const statistics = useFileStatistics();
  return (
    <AppNavigation
      role={session.user.role}
      profile={{ name: session.user.name, email: session.user.email }}
      storage={
        statistics.data
          ? {
              usedBytes: Number(statistics.data.storedBytes),
              limitBytes: Number(statistics.data.quota.limitBytes),
            }
          : undefined
      }
    />
  );
}
