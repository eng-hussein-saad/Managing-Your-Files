import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FileStatistics } from "../../src/features/dashboard/components/file-statistics";

const history = Array.from({ length: 30 }, (_value, index) => ({
  date: `2026-08-${(index + 1).toString().padStart(2, "0")}`,
  count: index === 29 ? 2 : 0,
}));
describe("personal file dashboard", () => {
  it("renders totals, accessible quota, normalized distribution, and 30-day history", () => {
    render(
      <FileStatistics
        data={{
          fileCount: 2,
          storedBytes: "50",
          quota: { usedBytes: "50", remainingBytes: "50", limitBytes: "100" },
          typeDistribution: [
            { type: "pdf", count: 1 },
            { type: "text", count: 1 },
            { type: "image", count: 0 },
            { type: "document", count: 0 },
          ],
          uploadHistory: history,
          timeZone: "Africa/Cairo",
        }}
      />,
    );
    expect(screen.getByText(/2 files/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "50");
    expect(screen.getByRole("table")).toHaveAccessibleName(/Africa\/Cairo/i);
    expect(screen.getAllByRole("row")).toHaveLength(31);
  });
  it("provides a useful empty distribution without hiding history", () => {
    render(
      <FileStatistics
        data={{
          fileCount: 0,
          storedBytes: "0",
          quota: { usedBytes: "0", remainingBytes: "100", limitBytes: "100" },
          typeDistribution: [],
          uploadHistory: history.map((item) => ({ ...item, count: 0 })),
          timeZone: "UTC",
        }}
      />,
    );
    expect(screen.getByText(/no stored file types/i)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(31);
  });
});
