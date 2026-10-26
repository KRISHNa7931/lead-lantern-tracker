import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS, filterLeads, hasActiveFilters, isDueToday, isOverdue, sortLeads, toLocalDateString, type Lead,
} from "./leads";

const mk = (id: string, status: string, created_at: string, follow_up_date: string | null = null): Lead => ({
  id, name: id, mobile: "9876543210", business_name: null, city: null, service: "RCS SMS",
  status, notes: null, follow_up_date, created_by: null, created_at, updated_at: created_at,
});
const a = mk("a", "New", "2026-01-01T00:00:00Z", "2026-03-05");
const b = mk("b", "Interested", "2026-01-02T00:00:00Z");
const c = mk("c", "Interested", "2026-01-03T00:00:00Z", "2026-03-01");
const d = mk("d", "Closed", "2026-01-04T00:00:00Z", "2026-03-01");
const all = [a, b, c, d];
const ids = (l: Lead[]) => l.map((x) => x.id);

describe("sortLeads", () => {
  it("newest first by default", () => expect(ids(sortLeads(all, "newest"))).toEqual(["d", "c", "b", "a"]));
  it("oldest first", () => expect(ids(sortLeads(all, "oldest"))).toEqual(["a", "b", "c", "d"]));
  it("Interested first keeps every lead, newest inside groups", () =>
    expect(ids(sortLeads(all, "status:Interested"))).toEqual(["c", "b", "d", "a"]));
  it("follow-up date earliest first, no date last", () =>
    expect(ids(sortLeads(all, "followup"))).toEqual(["d", "c", "a", "b"]));
});

describe("due dates", () => {
  it("local date string uses local calendar day", () =>
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05"));
  it("due today and overdue skip Closed / Not Interested", () => {
    expect(isDueToday(c, "2026-03-01")).toBe(true);
    expect(isDueToday(d, "2026-03-01")).toBe(false);
    expect(isOverdue(c, "2026-03-02")).toBe(true);
    expect(isOverdue(a, "2026-03-02")).toBe(false);
  });
  it("due filter combines with status filter", () =>
    expect(ids(filterLeads(all, { ...EMPTY_FILTERS, due: "overdue", status: "Interested" }, "2026-03-10"))).toEqual(["c"]));
});

describe("clear filters visibility", () => {
  it("hidden with no filters", () => expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false));
  it("shown when due filter is on", () => expect(hasActiveFilters({ ...EMPTY_FILTERS, due: "today" })).toBe(true));
});
