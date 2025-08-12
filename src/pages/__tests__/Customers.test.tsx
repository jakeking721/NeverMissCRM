import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import Customers from "../../pages/Customers";
import { AuthProvider } from "../../context/AuthContext";
import { MemoryRouter } from "react-router-dom";

describe("<Customers />", () => {
  it("renders the title", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Customers />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Customers/i)).toBeInTheDocument();
  });
});
