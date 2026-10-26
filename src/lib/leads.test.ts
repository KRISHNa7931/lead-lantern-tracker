import { describe, expect, it } from "vitest";

import { normalizeMobile, waLink } from "./leads";

describe("normalizeMobile", () => {
  it("keeps a plain 10-digit number", () => {
    expect(normalizeMobile("9876543210")).toBe("9876543210");
  });

  it("normalizes '98765 43210' with a space", () => {
    expect(normalizeMobile("98765 43210")).toBe("9876543210");
  });

  it("normalizes '+91 98765-43210'", () => {
    expect(normalizeMobile("+91 98765-43210")).toBe("9876543210");
  });

  it("normalizes '098765 43210' with a leading zero", () => {
    expect(normalizeMobile("098765 43210")).toBe("9876543210");
  });

  it("rejects '12345' (too short)", () => {
    expect(normalizeMobile("12345")).toBeNull();
  });

  it("rejects a 10-digit number starting with 5", () => {
    expect(normalizeMobile("5123456789")).toBeNull();
  });

  it("rejects an 11-digit number", () => {
    expect(normalizeMobile("98765432101")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(normalizeMobile("")).toBeNull();
  });
});

describe("waLink", () => {
  it("builds a wa.me link with the 91 prefix and encoded message", () => {
    expect(waLink("9876501001", "Hi there")).toBe(
      "https://wa.me/919876501001?text=Hi%20there",
    );
  });
});
