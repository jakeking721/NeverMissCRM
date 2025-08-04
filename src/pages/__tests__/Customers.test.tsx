import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import Customers from "../../pages/Customers";
import { AuthProvider } from "../../context/AuthContext";

describe("<Customers />", () => {
  it("renders the title", async () => {
    render(
      <AuthProvider>
        <Customers />
      </AuthProvider>
    );
    expect(await screen.findByText(/Customers/i)).toBeInTheDocument();
  });
});
