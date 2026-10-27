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

// ---------- Follow-up dates (compared in the user's LOCAL calendar) ----------

/** YYYY-MM-DD built from local year/month/day (never toISOString, avoids IST off-by-one). */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string as a local date (midnight local time). */
export function parseLocalDate(value: string): Date {
  const [y = 1970, m = 1, d = 1] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const INACTIVE_STATUSES = ["Closed", "Not Interested"];

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

export function followUpState(
  lead: Pick<Lead, "follow_up_date">,
  today: string = toLocalDateString(),
): FollowUpState {
  const date = lead.follow_up_date?.slice(0, 10);
  if (!date) return "none";
  if (date < today) return "overdue";
  if (date === today) return "today";
  return "upcoming";
}

/** Due-today / overdue only count open leads (not Closed / Not Interested). */
export function isDueToday(lead: Pick<Lead, "follow_up_date" | "status">, today?: string) {
  return !INACTIVE_STATUSES.includes(lead.status) && followUpState(lead, today) === "today";
}
export function isOverdue(lead: Pick<Lead, "follow_up_date" | "status">, today?: string) {
  return !INACTIVE_STATUSES.includes(lead.status) && followUpState(lead, today) === "overdue";
}

// ---------- Filtering & sorting (all in the browser) ----------

export type DueFilter = "today" | "overdue" | null;

export interface LeadFilters {
  search: string;
  status: string | null;
  service: string | null;
  due: DueFilter;
}

export const EMPTY_FILTERS: LeadFilters = { search: "", status: null, service: null, due: null };

export function hasActiveFilters(f: LeadFilters): boolean {
  return f.search.trim() !== "" || f.status !== null || f.service !== null || f.due !== null;
}

export function filterLeads<T extends Lead>(leads: T[], f: LeadFilters, today?: string): T[] {
  const term = f.search.trim().toLowerCase();
  const digits = f.search.replace(/\D/g, "");
  return leads.filter((lead) => {
    if (term && !lead.name.toLowerCase().includes(term) && !(digits && lead.mobile.includes(digits))) {
      return false;
    }
    if (f.status && lead.status !== f.status) return false;
    if (f.service && lead.service !== f.service) return false;
    if (f.due === "today" && !isDueToday(lead, today)) return false;
    if (f.due === "overdue" && !isOverdue(lead, today)) return false;
    return true;
  });
}

export const SORT_OPTIONS = [
  { value: "status:Interested", label: "Interested first" },
  { value: "status:New", label: "New first" },
  { value: "status:Contacted", label: "Contacted first" },
  { value: "status:Closed", label: "Closed first" },
  { value: "followup", label: "Follow-up date (earliest first)" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"] | "";

/** Default sort: newest first by created_at descending (no option selected). */
export const DEFAULT_SORT: SortOption = "";

export function sortLeads<T extends Lead>(leads: T[], sort: SortOption): T[] {
  const newest = (a: T, b: T) => b.created_at.localeCompare(a.created_at);
  const list = [...leads];
  if (sort === "followup") {
    return list.sort((a, b) => {
      const da = a.follow_up_date?.slice(0, 10);
      const db = b.follow_up_date?.slice(0, 10);
      if (da && db && da !== db) return da.localeCompare(db);
      if (da && !db) return -1;
      if (!da && db) return 1;
      return newest(a, b);
    });
  }
  if (sort.startsWith("status:")) {
    const status = sort.slice(7);
    return list.sort((a, b) => {
      const ga = a.status === status ? 0 : 1;
      const gb = b.status === status ? 0 : 1;
      return ga - gb || newest(a, b);
    });
  }
  return list.sort(newest);
}
