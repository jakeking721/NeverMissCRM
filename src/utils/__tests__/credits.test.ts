import { describe, it, expect } from "vitest";
import { getCredits, addCredits, deductCredits } from "../../utils/credits";

// Minimal mock user
const mkUser = (credits = 0) => ({ username: "test", email: "t@test.com", credits });

describe("credits utils", () => {
  it("adds credits", () => {
    const u: any = mkUser(0);
    addCredits(u, 50);
    expect(getCredits(u)).toBe(50);
  });

  it("deducts credits safely", () => {
    const u: any = mkUser(100);
    deductCredits(u, 60);
    expect(getCredits(u)).toBe(40);
  });
});
