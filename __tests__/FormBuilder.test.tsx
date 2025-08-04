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
  fireEvent.click(newBtn);

  const textBtn = await screen.findByText("Text");
  fireEvent.click(textBtn);

  const colorInput = screen.getByLabelText("Background Color");
  fireEvent.change(colorInput, { target: { value: "#ff0000" } });

  const saveBtn = await screen.findByText("Save");
  fireEvent.click(saveBtn);

  await vi.waitFor(() => expect(saveForm).toHaveBeenCalled());
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
  fireEvent.click(newBtn);

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

test("adds checkbox and multiselect blocks and edits properties", async () => {
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
  fireEvent.click(newBtn);

  // Add checkbox block and edit label
  fireEvent.click(await screen.findByText("Checkbox"));
  const labelInput = await screen.findByDisplayValue("Label");
  fireEvent.change(labelInput, { target: { value: "Pick" } });
  expect(screen.getByText("Pick")).toBeInTheDocument();

  // Add multiselect block and edit options
  fireEvent.click(await screen.findByText("Multi-Select"));
  const optionsArea = await screen.findByDisplayValue(/Option 1/);
  fireEvent.change(optionsArea, { target: { value: "One\nTwo" } });
  expect(screen.getAllByText("Two").length).toBeGreaterThan(0);
});
