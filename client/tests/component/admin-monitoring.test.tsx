import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "../../src/features/admin/components/admin-dashboard";
import { AdminAuditHistory } from "../../src/features/admin/components/admin-audit-history";
import {
  adminAuditResponseFixture,
  adminStatisticsResponseFixture,
} from "../fixtures/admin";

const useAdminStatistics = vi.fn();
const useAdminAuditEvents = vi.fn();
vi.mock("../../src/features/admin/hooks/use-admin-monitoring", () => ({
  useAdminStatistics:
    /** Supplies deterministic administrator statistics. */ () =>
      useAdminStatistics(),
  useAdminAuditEvents: /** Supplies deterministic sanitized audit history. */ (
    ...args: unknown[]
  ) => useAdminAuditEvents(...args),
}));

describe("administrator monitoring experience", () => {
  it("renders exact totals and safe recent uploads", () => {
    useAdminStatistics.mockReturnValue({
      isLoading: false,
      error: null,
      data: adminStatisticsResponseFixture(),
    });
    render(<AdminDashboard />);
    expect(screen.getByText("4 KiB")).toBeInTheDocument();
    expect(screen.getByText("fixture-report.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText(/Total users:/)).toBeVisible();
  });
  it("renders live, deleted, and system actor labels without unsafe metadata", () => {
    const base = adminAuditResponseFixture();
    useAdminAuditEvents.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          base,
          {
            ...base,
            id: "60000000-0000-4000-8000-000000000060",
            actor: { kind: "deleted", label: "Deleted user" },
          },
          {
            ...base,
            id: "60000000-0000-4000-8000-000000000061",
            actor: { kind: "system", label: "System" },
          },
        ],
        meta: { totalPages: 1 },
      },
    });
    render(
      <AdminAuditHistory
        query={{ direction: "desc", page: 1, pageSize: 20 }}
        update={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Deleted user").length).toBeGreaterThan(1);
    expect(screen.getAllByText("System").length).toBeGreaterThan(1);
    expect(screen.queryByText(/storage/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("User Role Changed")).toHaveLength(3);
    expect(screen.queryByText("admin.user.role_changed")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Outcome" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Outcome" })).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Sanitized audit history",
    );
  });
});
