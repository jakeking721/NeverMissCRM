import { render, screen, fireEvent } from "@testing-library/react";
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
  render(
    <MemoryRouter initialEntries={["/builder"]}>
      <Routes>
        <Route path="/builder" element={<FormList />} />
        <Route path="/builder/:formId" element={<FormBuilder />} />
      </Routes>
    </MemoryRouter>
  );

  const newBtn = await screen.findByText(/New Form/i);
  fireEvent.click(newBtn);

  const textBtn = await screen.findByText("Text");
  fireEvent.click(textBtn);

  const saveBtn = await screen.findByText("Save");
  fireEvent.click(saveBtn);

  await vi.waitFor(() => expect(saveForm).toHaveBeenCalled());
  const payload = (saveForm as any).mock.calls[0][0];
  expect(payload.schema_json.blocks[0].type).toBe("text");
});
