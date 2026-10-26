import { format } from "date-fns";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { followUpState, parseLocalDate, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";

const stateClass = {
  overdue: "border-destructive/50 bg-destructive/10 text-destructive",
  today: "border-status-contacted/50 bg-status-contacted-soft text-status-contacted",
  upcoming: "",
  none: "text-muted-foreground",
};

/** Inline follow-up date picker: changing or clearing saves immediately. */
export function FollowUpDateInput({
  lead,
  onChange,
  className,
}: {
  lead: Lead;
  onChange: (date: string | null) => void;
  className?: string;
}) {
  const value = lead.follow_up_date?.slice(0, 10) ?? "";
  const state = followUpState(lead);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        type="date"
        value={value}
        aria-label={`Follow-up date for ${lead.name}`}
        title={value ? format(parseLocalDate(value), "d MMM yyyy") : "No follow-up date"}
        onChange={(event) => onChange(event.target.value || null)}
        className={cn("h-11 w-[150px] px-2 text-sm md:h-9", stateClass[state])}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear follow-up date"
          className="size-11 shrink-0 text-muted-foreground md:size-9"
          onClick={() => onChange(null)}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
