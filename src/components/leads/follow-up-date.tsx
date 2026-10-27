import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { followUpState, parseLocalDate, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";

const stateClass: Record<string, string> = {
  overdue: "border-destructive/50 bg-destructive/10 text-destructive",
  today: "border-status-contacted/50 bg-status-contacted-soft text-status-contacted",
  upcoming: "",
  none: "text-muted-foreground",
};

/**
 * Follow-up date picker with explicit confirm step.
 *
 * - While editing: input highlights with an accent border; a ✓ save button and
 *   an ✗ revert button appear. Nothing is saved until ✓ is clicked.
 * - When nothing is pending: only an ✗ clear button appears (if a date is set).
 */
export function FollowUpDateInput({
  lead,
  onChange,
  className,
}: {
  lead: Lead;
  onChange: (date: string | null) => void;
  className?: string;
}) {
  const savedValue = lead.follow_up_date?.slice(0, 10) ?? "";

  // Local draft — only sent to parent when the user confirms.
  const [draft, setDraft] = useState(savedValue);

  // Sync draft whenever the server value changes (e.g. after a save lands).
  useEffect(() => {
    setDraft(lead.follow_up_date?.slice(0, 10) ?? "");
  }, [lead.follow_up_date]);

  const isDirty = draft !== savedValue;
  const state = followUpState(lead); // derived from saved value only

  function handleConfirm() {
    onChange(draft || null);
  }

  function handleRevert() {
    setDraft(savedValue);
  }

  function handleClear() {
    setDraft("");
    onChange(null);
  }

  let titleText = "No follow-up date";
  if (draft) {
    try {
      titleText = format(parseLocalDate(draft), "d MMM yyyy");
    } catch {
      titleText = draft;
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        type="date"
        value={draft}
        aria-label={`Follow-up date for ${lead.name}`}
        title={titleText}
        onChange={(event) => setDraft(event.target.value)}
        className={cn(
          "h-8 w-[155px] rounded-md px-2 text-[12px] transition-colors duration-150",
          // While editing: accent border so user knows it's pending
          isDirty
            ? "border-primary/60 bg-primary/5 text-foreground ring-1 ring-primary/30"
            : stateClass[state],
        )}
      />

      {/* Pending state: ✓ confirm + ✗ revert */}
      {isDirty && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Save follow-up date"
            className="size-8 shrink-0 rounded-md text-primary transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
            onClick={handleConfirm}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Revert follow-up date"
            className="size-8 shrink-0 rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
            onClick={handleRevert}
          >
            <X className="size-3" />
          </Button>
        </>
      )}

      {/* Idle state with saved date: ✗ clear */}
      {!isDirty && savedValue && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear follow-up date"
          className="size-8 shrink-0 rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
          onClick={handleClear}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
