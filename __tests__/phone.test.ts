import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/utils/phone";

describe("normalizePhone", () => {
  it("normalizes US numbers to E.164", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
  });

  it("returns null for invalid inputs", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
  });
});
