import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FileoraBrand } from "../../src/components/brand/fileora-brand";
import { AppFooter } from "../../src/components/layout/app-footer";

describe("Fileora shell primitives", () => {
  it("renders the approved identity and tagline", () => {
    render(<FileoraBrand tagline />);
    expect(screen.getByRole("link", { name: /Fileora/ })).toBeInTheDocument();
    expect(screen.getByText("Your files. Organized your way.")).toBeInTheDocument();
  });
  it("keeps the footer in normal document flow", () => {
    const { container } = render(<AppFooter />);
    expect(container.querySelector("footer")).toHaveClass("app-footer");
  });
});
