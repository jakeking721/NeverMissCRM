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

vi.mock("@/services/campaignService", () => ({
  getCampaigns: vi.fn().mockResolvedValue([
    { id: "c1", name: "Test Campaign", message: "", recipients: [], status: "draft", createdAt: "" },
  ]),
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

  const titleBtn = await screen.findByText("Form Title");
  fireEvent.click(titleBtn);

  const colorInput = screen.getByLabelText("Background Color");
  fireEvent.change(colorInput, { target: { value: "#ff0000" } });

  const slugInput = screen.getByLabelText(/Slug/i);
  fireEvent.change(slugInput, { target: { value: "test-form" } });

  const campaignSelect = await screen.findByLabelText(/Campaign/i);
  fireEvent.change(campaignSelect, { target: { value: "c1" } });

  const saveBtn = await screen.findByText("Save");
  await act(async () => {
    fireEvent.click(saveBtn);
  });

  await vi.waitFor(() => expect(saveForm).toHaveBeenCalled());
  await screen.findByText(/New Form/i);
  const payload = (saveForm as any).mock.calls[0][0];
  expect(payload.schema_json.blocks[0].type).toBe("title");
  expect(payload.schema_json.style.backgroundColor).toBe("#ff0000");
  expect(payload.slug).toBe("test-form");
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
  fireEvent.click(await screen.findByText("Form Title"));
  fireEvent.click(await screen.findByText("Text Input"));

  // Select first block
  const firstBlock = screen.getAllByText("Form Title")[1];
  fireEvent.click(firstBlock);

  const input = await screen.findByDisplayValue("Form Title");
  fireEvent.change(input, { target: { value: "Hello" } });

  // Preview should update
  expect(screen.getAllByText("Hello").length).toBeGreaterThan(0);
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
