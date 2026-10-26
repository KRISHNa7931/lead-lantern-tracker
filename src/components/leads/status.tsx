import { ChevronDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUSES } from "@/lib/leads";

const STATUS_STYLES: Record<string, string> = {
  New: "bg-status-new-soft text-status-new border-status-new/25",
  Contacted:
    "bg-status-contacted-soft text-status-contacted border-status-contacted/25",
  Interested:
    "bg-status-interested-soft text-status-interested border-status-interested/25",
  Closed: "bg-status-closed-soft text-status-closed border-status-closed/25",
  "Not Interested":
    "bg-status-not-interested-soft text-status-not-interested border-status-not-interested/25",
};

export function statusDotClass(status: string): string {
  const map: Record<string, string> = {
    New: "bg-status-new",
    Contacted: "bg-status-contacted",
    Interested: "bg-status-interested",
    Closed: "bg-status-closed",
    "Not Interested": "bg-status-not-interested",
  };
  return map[status] ?? "bg-muted-foreground";
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {status}
    </span>
  );
}

interface StatusSelectProps {
  value: string;
  onValueChange: (status: string) => void;
  className?: string;
}

export function StatusSelect({ value, onValueChange, className }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={`Status: ${value}`}
        className={cn(
          "w-fit gap-1.5 border-0 bg-transparent p-0 shadow-none focus:ring-0 focus-visible:ring-0 [&>svg:last-child]:opacity-50",
          className,
        )}
      >
        <span className="flex items-center gap-1.5">
          <StatusBadge status={value} />
          <ChevronDown className="size-3.5 opacity-50" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="py-2">
            <StatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
