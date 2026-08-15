import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "@/components/admin/MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders markdown heading", () => {
    render(<MarkdownPreview content="# Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders markdown paragraph", () => {
    render(<MarkdownPreview content="This is a paragraph." />);
    expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
  });

  it("renders code block", () => {
    render(<MarkdownPreview content={"```js\nconst x = 1;\n```"} />);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders empty state when no content", () => {
    render(<MarkdownPreview content="" />);
    expect(screen.getByText("Preview will appear here...")).toBeInTheDocument();
  });
});
