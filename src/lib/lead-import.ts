import { SERVICES, normalizeMobile, type Lead } from "./leads";

export const IMPORT_CHUNK_SIZE = 100;
export const SAMPLE_CSV = "name,mobile,business_name,city,service,notes,follow_up_date\r\nRohan Mehta,+91 98765-43210,Mehta Sweets,Jamnagar,WhatsApp Bulk,Interested in a demo,2026-11-01\r\nPriya Shah,9123456780,Shah Boutique,Ahmedabad,RCS SMS,Call next week,\r\n";

export interface ImportedLead {
  name: string;
  mobile: string;
  business_name: string | null;
  city: string | null;
  service: string;
  notes: string | null;
  follow_up_date: string | null;
  status: "New";
}

export interface ImportRow {
  rowNumber: number;
  status: "Valid" | "Invalid" | "Duplicate";
  reason: string;
  lead: ImportedLead;
}

const text = (value: unknown): string => value == null ? "" : String(value).trim();

function dateValue(value: unknown): string | null {
  if (!text(value)) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const raw = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "invalid";
  const parsed = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : "invalid";
}

export function validateImportRows(matrix: unknown[][], existing: Pick<Lead, "mobile">[]): ImportRow[] {
  const headerIndex = matrix.findIndex((row) => row.some((cell) => text(cell)));
  const headers = matrix[headerIndex]?.map((cell) => text(cell).replace(/^\uFEFF/, "").toLowerCase()) ?? [];
  if (!headers.length) throw new Error("The file is empty.");
  const missing = ["name", "mobile", "service"].filter((name) => !headers.includes(name));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}.`);
  const get = (row: unknown[], key: string): unknown => row[headers.indexOf(key)];
  const existingMobiles = new Set(existing.map((lead) => normalizeMobile(lead.mobile)).filter(Boolean));
  const seen = new Set<string>();
  const rows: ImportRow[] = [];
  matrix.slice(headerIndex + 1).forEach((row, index) => {
    if (!row.some((cell) => text(cell))) return;
    const mobile = normalizeMobile(text(get(row, "mobile")));
    const serviceInput = text(get(row, "service"));
    const service = SERVICES.find((item) => item.toLowerCase() === serviceInput.toLowerCase());
    const followUp = dateValue(get(row, "follow_up_date"));
    const lead: ImportedLead = {
      name: text(get(row, "name")), mobile: mobile ?? text(get(row, "mobile")),
      business_name: text(get(row, "business_name")) || text(get(row, "business")) || null,
      city: text(get(row, "city")) || null, service: service ?? serviceInput,
      notes: text(get(row, "notes")) || null,
      follow_up_date: followUp === "invalid" ? null : followUp, status: "New",
    };
    const reasons = [
      !lead.name ? "Name is required" : "",
      !mobile ? "Enter a valid 10-digit mobile number" : "",
      !service ? "Unknown service" : "",
      followUp === "invalid" ? "Follow-up date must be a valid YYYY-MM-DD date" : "",
    ].filter(Boolean);
    const duplicate = mobile && (existingMobiles.has(mobile) || seen.has(mobile));
    rows.push({ rowNumber: headerIndex + index + 2, lead,
      status: reasons.length ? "Invalid" : duplicate ? "Duplicate" : "Valid",
      reason: reasons.length ? reasons.join("; ") : duplicate ? (existingMobiles.has(mobile) ? "Mobile already exists in leads" : "Mobile repeated in this file") : "",
    });
    // An invalid row does not prevent a later valid occurrence from being imported.
    if (mobile && !reasons.length) seen.add(mobile);
  });
  if (!rows.length) throw new Error("The file contains no lead rows.");
  return rows;
}

export async function importInChunks<T>(rows: ImportedLead[], insert: (chunk: ImportedLead[]) => Promise<T[]>, onChunk: (saved: T[], completed: number) => void): Promise<void> {
  for (let start = 0; start < rows.length; start += IMPORT_CHUNK_SIZE) {
    const saved = await insert(rows.slice(start, start + IMPORT_CHUNK_SIZE));
    onChunk(saved, Math.min(start + IMPORT_CHUNK_SIZE, rows.length));
  }
}