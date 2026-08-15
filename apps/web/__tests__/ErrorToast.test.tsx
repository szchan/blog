import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorToast } from "@/components/ui/ErrorToast";

describe("ErrorToast", () => {
  it("displays error message", () => {
    render(<ErrorToast message="Something went wrong" onClose={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<ErrorToast message="" onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<ErrorToast message="Error" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close error"));
    expect(onClose).toHaveBeenCalled();
  });
});
