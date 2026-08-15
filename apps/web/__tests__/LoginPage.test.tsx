import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/app/admin/login/page";

vi.mock("@/lib/admin-api", () => ({
  login: vi.fn(),
  getMe: vi.fn().mockRejectedValue(new Error("No token")),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("renders login button", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    const { login } = await import("@/lib/admin-api");
    vi.mocked(login).mockRejectedValueOnce(new Error("Invalid"));
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByText("Incorrect email or password")).toBeInTheDocument();
    });
  });
});
