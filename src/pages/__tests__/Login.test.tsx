import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/utils/supabaseClient", () => {
  const mockSignIn = vi.fn().mockResolvedValue({ error: null });
  return { supabase: { auth: { signInWithPassword: mockSignIn } } };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../utils/auth", async () => {
  const actual = (await vi.importActual("../../utils/auth")) as any;
  return { ...actual, refreshCurrentUser: () => Promise.resolve(null) };
});

import { supabase } from "@/utils/supabaseClient";
import Login from "../Login";
import { AuthProvider } from "../../context/AuthContext";

describe("<Login />", () => {
  it("redirects to dashboard after successful login", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByTestId("password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword as any).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });
});
