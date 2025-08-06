import { describe, it, expect } from "vitest";
import * as yup from "@/utils/yup";

describe("yup boolean", () => {
  it("validates required true", async () => {
    const schema = yup.boolean().oneOf([true], "Required");
    await expect(schema.validate(true)).resolves.toBe(true);
    await expect(schema.validate(false)).rejects.toThrow("Required");
  });
});