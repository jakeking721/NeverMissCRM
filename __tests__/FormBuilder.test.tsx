import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";

import FormList from "@/pages/builder/FormList";
import FormBuilder from "@/pages/builder/FormBuilder";

vi.mock("@/services/forms", () => ({
  fetchForms: vi.fn().mockResolvedValue([]),
  fetchForm: vi.fn().mockResolvedValue(null),
  saveForm: vi.fn().mockResolvedValue({}),
  deleteForm: vi.fn(),
}));

import { saveForm } from "@/services/forms";

test("adds text block and saves", async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/builder"]}>
        <Routes>
          <Route path="/builder" element={<FormList />} />
          <Route path="/builder/:formId" element={<FormBuilder />} />
        </Routes>
      </MemoryRouter>
    );
  });

  const newBtn = await screen.findByText(/New Form/i);
  await act(async () => {
    fireEvent.click(newBtn);
  });

  const textBtn = await screen.findByText("Text");
  fireEvent.click(textBtn);

  const colorInput = screen.getByLabelText("Background Color");
  fireEvent.change(colorInput, { target: { value: "#ff0000" } });

  const saveBtn = await screen.findByText("Save");
  await act(async () => {
    fireEvent.click(saveBtn);
  });

  await vi.waitFor(() => expect(saveForm).toHaveBeenCalled());
  await screen.findByText(/New Form/i);
  const payload = (saveForm as any).mock.calls[0][0];
  expect(payload.schema_json.blocks[0].type).toBe("text");
  expect(payload.schema_json.style.backgroundColor).toBe("#ff0000");
});

test("clicking block opens inspector and updates preview", async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/builder"]}>
        <Routes>
          <Route path="/builder" element={<FormList />} />
          <Route path="/builder/:formId" element={<FormBuilder />} />
        </Routes>
      </MemoryRouter>
    );
  });

  const newBtn = await screen.findByText(/New Form/i);
  await act(async () => {
    fireEvent.click(newBtn);
  });

  // Add two blocks
  fireEvent.click(await screen.findByText("Text"));
  fireEvent.click(await screen.findByText("Input"));

  // Select first block
  const firstBlock = screen.getAllByText("Text")[1]; // block text appears twice (palette and canvas)
  fireEvent.click(firstBlock);

  const textarea = await screen.findByDisplayValue("Text");
  fireEvent.change(textarea, { target: { value: "Hello" } });

  // Preview should update
  expect(screen.getAllByText("Hello").length).toBeGreaterThan(0);
});

test("mobile palette toggles", async () => {
  // simulate mobile viewport
  (window as any).innerWidth = 375;
  window.dispatchEvent(new Event("resize"));

  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/builder"]}>
        <Routes>
          <Route path="/builder" element={<FormList />} />
          <Route path="/builder/:formId" element={<FormBuilder />} />
        </Routes>
      </MemoryRouter>
    );
  });

  const newBtn = await screen.findByText(/New Form/i);
  await act(async () => {
    fireEvent.click(newBtn);
  });

  const blocksBtn = await screen.findByText("Blocks");
  // palette drawer closed initially
  expect(screen.queryByTestId("mobile-palette")).toBeNull();
  fireEvent.click(blocksBtn);
  // palette now visible
  expect(await screen.findByTestId("mobile-palette")).toBeDefined();
});
