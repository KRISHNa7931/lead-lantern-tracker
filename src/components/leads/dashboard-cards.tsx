import { cn } from "@/lib/utils";
import { STATUSES } from "@/lib/leads";
import { statusDotClass } from "./status";

interface DashboardCardsProps {
  leads: { status: string }[];
  selectedStatus: string | null;
  onSelectStatus: (status: string | null) => void;
}

/** Counts always come from the FULL lead list, never the filtered one. */
export function DashboardCards({
  leads,
  selectedStatus,
  onSelectStatus,
}: DashboardCardsProps) {
  const cards = [
    { status: null, label: "Total", count: leads.length },
    ...STATUSES.map((status) => ({
      status: status as string | null,
      label: status,
      count: leads.filter((lead) => lead.status === status).length,
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
      {cards.map((card) => {
        const selected = selectedStatus === card.status;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelectStatus(selected ? null : card.status)}
            aria-pressed={selected}
            className={cn(
              "flex min-h-[64px] flex-col justify-center gap-1 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors md:min-h-[72px] md:px-4",
              selected
                ? "border-primary/40 bg-primary/5"
                : "hover:border-primary/30 hover:bg-accent/50",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  card.status ? statusDotClass(card.status) : "bg-primary",
                )}
              />
              <span className="truncate text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
            </span>
            <span className="text-xl font-semibold tabular-nums md:text-2xl">
              {card.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
