import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "@/components/blog/Pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} basePath="/blog" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page links", () => {
    render(
      <Pagination currentPage={2} totalPages={5} basePath="/blog" />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders prev link when not on first page", () => {
    render(
      <Pagination currentPage={2} totalPages={3} basePath="/blog" />,
    );
    expect(screen.getByText("← Prev")).toBeInTheDocument();
  });

  it("renders next link when not on last page", () => {
    render(
      <Pagination currentPage={1} totalPages={3} basePath="/blog" />,
    );
    expect(screen.getByText("Next →")).toBeInTheDocument();
  });

  it("does not render prev on first page", () => {
    render(
      <Pagination currentPage={1} totalPages={3} basePath="/blog" />,
    );
    expect(screen.queryByText("← Prev")).not.toBeInTheDocument();
  });

  it("builds hrefs with searchParams", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        basePath="/blog"
        searchParams={{ tag: "python" }}
      />,
    );
    const links = screen.getAllByRole("link");
    const prevLink = links.find((l) => l.textContent === "← Prev");
    expect(prevLink?.getAttribute("href")).toContain("tag=python");
    expect(prevLink?.getAttribute("href")).toContain("page=1");
  });
});
