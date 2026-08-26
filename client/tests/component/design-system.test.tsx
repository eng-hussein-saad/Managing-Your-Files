import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Field,
  IconButton,
  SearchField,
  SelectField,
} from "../../src/components/ui/controls";
import {
  CollectionToolbar,
  LocalScrollRegion,
  Pagination,
  ResponsiveTable,
  ViewToggle,
} from "../../src/components/ui/data-display";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  Metric,
  Pill,
  Skeleton,
  Status,
} from "../../src/components/ui/surfaces";

const css = readFileSync(
  resolve(process.cwd(), "client/src/app/globals.css"),
  "utf8",
);

describe("Fileora design system", () => {
  it("defines approved semantic tokens, contrast evidence, targets, and transitions", () => {
    expect(css).toMatch(/--color-text:\s*oklch\(/);
    expect(css).toMatch(/--color-surface:\s*oklch\(/);
    expect(css.match(/--color-on-accent:\s*oklch\(/g)).toHaveLength(2);
    expect(css).toMatch(/--contrast-normal:\s*[4-9]\.[5-9]/);
    expect(css).toMatch(/--contrast-large:\s*[3-9]\./);
    expect(css).toMatch(/--target-min:\s*44px/);
    expect(css.match(/--control-hover-ring:/g)).toHaveLength(2);
    expect(css).toMatch(
      /button:not\(:disabled\):hover,a\.ui-button:hover,label\.ui-button:hover\s*\{[^}]*box-shadow:[^}]*--control-hover-ring/s,
    );
    expect(css).toMatch(/\.app-sidebar \.brand\s*\{[^}]*font:700 24px/s);
    expect(css).toMatch(
      /\.app-sidebar \.brand-mark svg\s*\{[^}]*inline-size:24px;[^}]*block-size:24px/s,
    );
    expect(css).not.toContain("dashboard-shell");
    expect(css).not.toContain("dashboard-route");
    expect(css).toMatch(
      /\.ui-button\.primary\s*\{[^}]*color:var\(--color-on-accent\)/s,
    );
    expect(css).toMatch(
      /\.dialog-actions button:last-child:not\(\.ui-button\)/,
    );
    expect(css).toContain("@media (max-width:1100px)");
    expect(css).toContain("@media (max-width:820px)");
    expect(css).toContain("@media (max-width:560px)");
  });

  it("renders labeled controls with help, errors, and standalone target semantics", () => {
    render(
      <>
        <Button>Save changes</Button>
        <IconButton label="More actions">…</IconButton>
        <Field
          label="Name"
          help="Shown on your profile"
          error="Name is required"
        />
        <SelectField label="Type" options={[{ value: "pdf", label: "PDF" }]} />
        <SearchField label="Search files" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Save changes" })).toHaveClass(
      "ui-button",
    );
    expect(screen.getByRole("button", { name: "More actions" })).toHaveClass(
      "ui-icon-button",
    );
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      /Shown on your profile Name is required/,
    );
    expect(screen.getByText("Name is required")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByLabelText("Type")).toBeVisible();
    expect(
      screen.getByRole("searchbox", { name: "Search files" }),
    ).toBeVisible();
  });

  it("renders reusable surfaces with text or icon cues in every status", () => {
    render(
      <Card>
        <Metric label="Files" value="12" detail="Private archive" />
        <Pill tone="success">Verified</Pill>
        <Avatar name="Ada Lovelace" />
        <Skeleton label="Loading archive" />
        <EmptyState title="No files" description="Upload your first file." />
        <ErrorState title="Files unavailable" description="Try again." />
        <Status tone="warning">Action required</Status>
      </Card>,
    );
    expect(screen.getByText("12")).toHaveAccessibleName("Files: 12");
    expect(screen.getByText("Verified")).toHaveTextContent(/✓/);
    expect(screen.getByLabelText("Ada Lovelace")).toHaveTextContent("AL");
    expect(
      screen.getByRole("status", { name: "Loading archive" }),
    ).toBeVisible();
    expect(screen.getByRole("status", { name: "No files" })).toBeVisible();
    expect(
      screen.getByRole("alert", { name: "Files unavailable" }),
    ).toBeVisible();
    expect(screen.getByText("Action required")).toHaveTextContent(/!/);
  });

  it("renders responsive collection, view, table, and pagination controls", () => {
    const onView = vi.fn();
    const onPage = vi.fn();
    render(
      <>
        <CollectionToolbar ariaLabel="File collection controls">
          Controls
        </CollectionToolbar>
        <LocalScrollRegion label="File results">
          <ResponsiveTable caption="Files">
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Report</td>
              </tr>
            </tbody>
          </ResponsiveTable>
        </LocalScrollRegion>
        <ViewToggle value="list" onChange={onView} />
        <Pagination page={2} totalPages={4} onPage={onPage} />
      </>,
    );
    expect(
      screen.getByRole("toolbar", { name: "File collection controls" }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "File results" }),
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table", { name: "Files" })).toBeVisible();
    fireEvent.click(
      within(screen.getByRole("group", { name: "Collection view" })).getByRole(
        "button",
        { name: "Grid view" },
      ),
    );
    expect(onView).toHaveBeenCalledWith("grid");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPage).toHaveBeenCalledWith(3);
    expect(screen.getByText("Page 2 of 4")).toBeVisible();
  });

  it("documents only the permitted SC 2.5.8 compact-control exception", () => {
    expect(css).toMatch(/\.ui-inline-link[^}]*--target-min-compact:\s*24px/s);
    expect(css).not.toMatch(
      /\.ui-(button|icon-button)[^}]*min-(width|height):\s*24px/s,
    );
  });
});
