"use client";
import { useQuery } from "@tanstack/react-query";
import { expressClient } from "../../lib/api/express-client";
import { PageState } from "../../components/status/page-state";
/** Confirms administrator access through the server-enforced Express operation. */
export default function AdminPage() {
  const access = useQuery({
    queryKey: ["auth", "admin-access"],
    queryFn: async () =>
      (
        await expressClient.get<{ success: true; data: { allowed: true } }>(
          "/api/v1/admin/access-check",
        )
      ).data,
  });
  if (access.isLoading)
    return <PageState title="Confirming administrator access" busy />;
  if (access.error) return <PageState title="Administrator access denied" />;
  return (
    <main id="main" className="dashboard">
      <span className="eyebrow">Administration</span>
      <h1>Boundary confirmed.</h1>
      <p>Gold Era verified your administrator role at the service authority.</p>
    </main>
  );
}
