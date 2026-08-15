import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(<ScrollReveal><p>Content</p></ScrollReveal>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
