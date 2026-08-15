import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "@/components/admin/ImageUploader";

vi.mock("@/lib/admin-api", () => ({
  uploadImage: vi.fn().mockResolvedValue({ url: "/uploads/test.png" }),
}));

describe("ImageUploader", () => {
  it("renders the current image URL", () => {
    render(<ImageUploader value="/uploads/existing.png" onChange={() => {}} />);
    expect(screen.getByDisplayValue("/uploads/existing.png")).toBeInTheDocument();
  });

  it("renders placeholder when no image", () => {
    render(<ImageUploader value="" onChange={() => {}} />);
    expect(screen.getByText("No image uploaded")).toBeInTheDocument();
  });

  it("calls onChange after successful upload", async () => {
    const onChange = vi.fn();
    render(<ImageUploader value="" onChange={onChange} />);
    const input = screen.getByLabelText("Upload image");
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("/uploads/test.png");
    });
  });
});
