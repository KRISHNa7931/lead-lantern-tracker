import { cn } from "@/lib/utils";
import { STATUSES, isDueToday, isOverdue, toLocalDateString, type DueFilter, type Lead } from "@/lib/leads";
import { statusDotClass } from "./status";

interface DashboardCardsProps {
  leads: Lead[];
  selectedStatus: string | null;
  onSelectStatus: (status: string | null) => void;
  selectedDue: DueFilter;
  onSelectDue: (due: DueFilter) => void;
}

/** Counts always come from the FULL lead list, never the filtered one. */
export function DashboardCards({
  leads,
  selectedStatus,
  onSelectStatus,
  selectedDue,
  onSelectDue,
}: DashboardCardsProps) {
  const today = toLocalDateString();

  const statusCards = [
    { status: null, label: "Total", count: leads.length },
    ...STATUSES.map((status) => ({
      status: status as string | null,
      label: status,
      count: leads.filter((lead) => lead.status === status).length,
    })),
  ];

  const dueCards = [
    {
      due: "today" as const,
      label: "Due today",
      count: leads.filter((l) => isDueToday(l, today)).length,
      dot: "bg-status-contacted",
    },
    {
      due: "overdue" as const,
      label: "Overdue",
      count: leads.filter((l) => isOverdue(l, today)).length,
      dot: "bg-destructive",
    },
  ];

  /* All 8 cards in one row on lg, 4 on sm/md, 2 on phone */
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {statusCards.map((card) => {
        const selected = selectedStatus === card.status;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelectStatus(selected ? null : card.status)}
            aria-pressed={selected}
            className={cn(
              "flex min-h-[64px] flex-col justify-center gap-0.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors duration-150",
              selected
                ? "border-primary/50 ring-1 ring-primary/30"
                : "border-border hover:border-primary/30 hover:bg-accent/40",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  card.status ? statusDotClass(card.status) : "bg-primary",
                )}
              />
              <span className="truncate text-[11px] font-medium text-muted-foreground">
                {card.label}
              </span>
            </span>
            {/* tabular-nums + lining figures so "11" doesn't look wide */}
            <span className="text-[22px] font-semibold leading-tight tabular-nums [font-variant-numeric:lining-nums]">
              {card.count}
            </span>
          </button>
        );
      })}

      {dueCards.map((card) => {
        const selected = selectedDue === card.due;
        return (
          <button
            key={card.due}
            type="button"
            onClick={() => onSelectDue(selected ? null : card.due)}
            aria-pressed={selected}
            className={cn(
              "flex min-h-[64px] flex-col justify-center gap-0.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors duration-150",
              selected
                ? "border-primary/50 ring-1 ring-primary/30"
                : "border-border hover:border-primary/30 hover:bg-accent/40",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("size-1.5 shrink-0 rounded-full", card.dot)} />
              <span className="truncate text-[11px] font-medium text-muted-foreground">
                {card.label}
              </span>
            </span>
            <span className="text-[22px] font-semibold leading-tight tabular-nums [font-variant-numeric:lining-nums]">
              {card.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
