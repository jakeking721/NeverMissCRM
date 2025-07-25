import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import Customers from "../../pages/Customers";
import { AuthProvider } from "../../context/AuthContext";

describe("<Customers />", () => {
  it("renders the title", () => {
    render(
      <AuthProvider>
        <Customers />
      </AuthProvider>
    );
    expect(screen.getByText(/Customers/i)).toBeInTheDocument();
  });
});
