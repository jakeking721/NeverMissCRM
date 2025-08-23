import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";

import FormList from "@/pages/forms/List";
import FormBuilder from "@/pages/forms/Edit";

vi.mock("@/services/forms", () => ({
  fetchForms: vi.fn().mockResolvedValue([]),
  fetchForm: vi.fn().mockResolvedValue(null),
  saveForm: vi.fn().mockResolvedValue({}),
  deleteForm: vi.fn(),
}));

import { saveForm } from "@/services/forms";

vi.spyOn(window, "alert").mockImplementation(() => {});

test("adds title block and saves", async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/forms"]}>
        <Routes>
          <Route path="/forms" element={<FormList />} />
          <Route path="/forms/:formId" element={<FormBuilder />} />
        </Routes>
      </MemoryRouter>
    );
  });

  const newBtn = await screen.findByText(/New Form/i);
  await act(async () => {
    fireEvent.click(newBtn);
  });

  const titleBtn = await screen.findByText("Header");
  fireEvent.click(titleBtn);

  const colorInput = screen.getByLabelText("Background Color");
  fireEvent.change(colorInput, { target: { value: "#ff0000" } });

  const titleInput = screen.getByLabelText(/Title/i);
  fireEvent.change(titleInput, { target: { value: "Test Form" } });

  const saveBtn = (await screen.findAllByText("Save")).find((el) =>
    el.className.includes("bg-green")
  )!;
  await act(async () => {
    fireEvent.click(saveBtn);
  });

  await vi.waitFor(() => expect(saveForm).toHaveBeenCalled());
  await screen.findByText(/New Form/i);
  const payload = (saveForm as any).mock.calls[0][0];
  expect(payload.schema_json.blocks[0].type).toBe("title");
  expect(payload.schema_json.style.backgroundColor).toBe("#ff0000");
  expect(payload.title).toBe("Test Form");
});

test("clicking block opens inspector and updates preview", async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/forms"]}>
        <Routes>
          <Route path="/forms" element={<FormList />} />
          <Route path="/forms/:formId" element={<FormBuilder />} />
        </Routes>
      </MemoryRouter>
    );
  });

  const newBtn = await screen.findByText(/New Form/i);
  await act(async () => {
    fireEvent.click(newBtn);
  });

  // Add two blocks
  fireEvent.click(await screen.findByText("Header"));
  fireEvent.click(await screen.findByText("Text Input"));

  // Select first block and ensure settings open
  const firstBlock = screen.getAllByText("Header")[1];
  fireEvent.click(firstBlock);

  // Property panel shows the editable input
  await screen.findByDisplayValue("Header");
});

test("mobile palette toggles", async () => {
  // simulate mobile viewport
  (window as any).innerWidth = 375;
  window.dispatchEvent(new Event("resize"));

  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/forms"]}>
        <Routes>
          <Route path="/forms" element={<FormList />} />
          <Route path="/forms/:formId" element={<FormBuilder />} />
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
