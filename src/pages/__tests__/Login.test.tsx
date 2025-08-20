import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Control Auth state manually using hoisted helpers
const authModule = vi.hoisted(() => {
  let state: any = { session: null, user: null };
  return {
    useAuth: vi.fn(() => state),
    setState: (s: any) => {
      state = s;
    },
  };
});
vi.mock("../../context/AuthContext", () => ({ useAuth: authModule.useAuth }));

const supabaseModule = vi.hoisted(() => ({
  mockSignIn: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/utils/supabaseClient", () => ({
  supabase: {
    auth: { signInWithPassword: supabaseModule.mockSignIn },
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import Login from "../Login";

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("<Login />", () => {
  it("redirects after auth state reports a user", async () => {
    const view = renderLogin();
    fireEvent.change(screen.getByTestId("email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByTestId("password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(supabaseModule.mockSignIn).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();

    // simulate auth listener updating context
    authModule.setState({
      session: { user: { id: "u1" } },
      user: {
        id: "u1",
        email: "a@b.com",
        username: "",
        role: "user",
        credits: 0,
        avatar: null,
        is_approved: true,
        is_active: true,
        deactivated_at: null,
      },
    });
    view.rerender(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    );
  });
});
