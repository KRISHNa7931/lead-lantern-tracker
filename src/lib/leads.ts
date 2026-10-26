export const SERVICES = [
  "WhatsApp Bulk",
  "RCS SMS",
  "Social Media Management",
  "WhatsApp AI Agent",
] as const;

export const STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Closed",
  "Not Interested",
] as const;

export type LeadService = (typeof SERVICES)[number];
export type LeadStatus = (typeof STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  business_name: string | null;
  city: string | null;
  service: string;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Normalizes any common Indian mobile input ("98765 43210", "+91 98765-43210",
 * "098765 43210") to a 10-digit string, or null when it is not a valid
 * 10-digit Indian mobile starting with 6-9.
 */
export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, ""); // strip spaces, +, dashes, brackets
  d = d.replace(/^0+/, ""); // drop leading 0
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2); // +91 prefix
  return /^[6-9]\d{9}$/.test(d) ? d : null; // valid 10-digit Indian mobile
}

/** Builds a wa.me deep link that opens the chat with the message prefilled. */
export function waLink(mobile10: string, message: string): string {
  return `https://wa.me/91${mobile10}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(mobile10: string, message: string): void {
  window.open(waLink(mobile10, message), "_blank", "noopener,noreferrer");
}
