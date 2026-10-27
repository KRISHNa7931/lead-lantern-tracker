import { describe, expect, it } from "vitest";
import { importInChunks, SAMPLE_CSV, validateImportRows, type ImportedLead } from "./lead-import";

const headers = ["name", "mobile", "service"];
const row = ["Rohan", "+91 98765-43210", "whatsapp bulk"];

describe("lead import rules", () => {
  it("normalizes mobiles, maps service case, trims headers, and accepts business alias", () => {
    const result = validateImportRows([[" NAME ", " Mobile ", " SERVICE ", "Business"], [...row, "Shop"]], []);
    expect(result[0]?.lead).toMatchObject({ mobile: "9876543210", service: "WhatsApp Bulk", business_name: "Shop", status: "New" });
    expect(result[0]?.status).toBe("Valid");
  });
  it("requires a name", () => expect(validateImportRows([headers, ["", row[1], row[2]]], [])[0]?.status).toBe("Invalid"));
  it("rejects invalid mobiles", () => expect(validateImportRows([headers, ["Rohan", "123", row[2]]], [])[0]?.status).toBe("Invalid"));
  it("rejects unknown services", () => expect(validateImportRows([headers, ["Rohan", row[1], "SMS"]], [])[0]?.status).toBe("Invalid"));
  it("accepts all four exact services regardless of case", () => {
    for (const service of ["WhatsApp Bulk", "RCS SMS", "Social Media Management", "WhatsApp AI Agent"]) {
      expect(validateImportRows([headers, [row[0], row[1], service.toUpperCase()]], [])[0]?.lead.service).toBe(service);
    }
  });
  it("skips mobiles already in loaded leads", () => expect(validateImportRows([headers, row], [{ mobile: "9876543210" }])[0]?.status).toBe("Duplicate"));
  it("imports only the first valid occurrence in the file", () => expect(validateImportRows([headers, row, row], []).map((item) => item.status)).toEqual(["Valid", "Duplicate"]));
  it("allows missing optional columns", () => expect(validateImportRows([headers, row], [])[0]?.lead.follow_up_date).toBeNull());
  it("rejects malformed dates and retains valid dates", () => {
    expect(validateImportRows([[...headers, "follow_up_date"], [...row, "2026-02-30"]], [])[0]?.status).toBe("Invalid");
    expect(validateImportRows([[...headers, "follow_up_date"], [...row, "2026-11-01"]], [])[0]?.lead.follow_up_date).toBe("2026-11-01");
  });
  it("rejects empty files and missing required columns", () => {
    expect(() => validateImportRows([], [])).toThrow("empty");
    expect(() => validateImportRows([headers], [])).toThrow("no lead rows");
    expect(() => validateImportRows([["name"], ["Rohan"]], [])).toThrow("mobile, service");
  });
  it("sample has the expected headers and two rows", () => {
    const matrix = SAMPLE_CSV.trim().split("\r\n").map((line) => line.split(","));
    expect(matrix[0]).toEqual(["name", "mobile", "business_name", "city", "service", "notes", "follow_up_date"]);
    expect(validateImportRows(matrix, []).filter((item) => item.status === "Valid")).toHaveLength(2);
  });
  it("inserts chunks of 100 and reports saved progress", async () => {
    const lead = validateImportRows([headers, row], [])[0]?.lead;
    if (!lead) throw new Error("Missing test lead");
    const chunks: number[] = [], progress: number[] = [];
    await importInChunks(Array.from({ length: 205 }, () => lead), async (chunk) => { chunks.push(chunk.length); return chunk; }, (_, completed) => progress.push(completed));
    expect(chunks).toEqual([100, 100, 5]);
    expect(progress).toEqual([100, 200, 205]);
  });
  it("stops on insertion failure without replaying successful chunks", async () => {
    const lead = validateImportRows([headers, row], [])[0]?.lead;
    if (!lead) throw new Error("Missing test lead");
    let calls = 0; const saved: ImportedLead[] = [];
    await expect(importInChunks(Array.from({ length: 101 }, () => lead), async (chunk) => {
      if (++calls === 2) throw new Error("Insert failed");
      return chunk;
    }, (chunk) => saved.push(...chunk))).rejects.toThrow("Insert failed");
    expect(saved).toHaveLength(100);
    expect(calls).toBe(2);
  });
});