import { format } from "date-fns";
import { Pencil, Sparkles, Trash2 } from "lucide-react";

import { FollowUpDateInput } from "@/components/leads/follow-up-date";
import { StatusSelect } from "@/components/leads/status";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/leads";

/**
 * Smart name renderer (same rules as the table):
 * - ≤ limit chars → single line
 * - > limit chars → all words except last on line 1, last word on line 2
 */
function SmartName({ text, limit }: { text: string; limit: number }) {
  if (!text || text.length <= limit) {
    return <span className="whitespace-nowrap">{text}</span>;
  }
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) {
    return <span className="whitespace-nowrap">{text}</span>;
  }
  const lastWord = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");
  return (
    <span>
      <span className="whitespace-nowrap">{rest}</span>
      <br />
      <span className="whitespace-nowrap">{lastWord}</span>
    </span>
  );
}

interface LeadCardsProps {
  leads: Lead[];
  onStatusChange: (lead: Lead, status: string) => void;
  onAiFollowUp: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onFollowUpChange: (lead: Lead, date: string | null) => void;
}

/** Mobile lead cards — slim, no horizontal page scroll, 44px+ tap targets. */
export function LeadCards({
  leads,
  onStatusChange,
  onAiFollowUp,
  onDelete,
  onEdit,
  onFollowUpChange,
}: LeadCardsProps) {
  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-none transition-shadow duration-150"
        >
          {/* Row 1: Name (smart wrap) + edit pencil + status pill */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-snug text-foreground">
                <SmartName text={lead.name} limit={18} />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Edit pencil — always visible on mobile cards */}
              <Button
                variant="ghost"
                aria-label="Edit lead"
                title="Edit"
                className="h-7 w-7 rounded-lg p-0 text-muted-foreground/60 transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
                onClick={() => onEdit(lead)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <StatusSelect
                value={lead.status}
                onValueChange={(status) => onStatusChange(lead, status)}
                className="shrink-0"
              />
            </div>
          </div>

          {/* Row 2: Mobile + city muted */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="whitespace-nowrap font-mono text-[13px] tabular-nums text-foreground">
              {lead.mobile}
            </span>
            {lead.city && (
              <span className="text-[13px] text-muted-foreground">{lead.city}</span>
            )}
          </div>

          {/* Row 3: Service tag */}
          <div className="mt-1.5">
            <span className="inline-block max-w-full truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {lead.service}
            </span>
          </div>

          {/* Row 4: Follow-up date */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Follow-up</span>
            <FollowUpDateInput
              lead={lead}
              onChange={(date) => onFollowUpChange(lead, date)}
            />
          </div>

          {/* Row 5: Date + action buttons */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              Added {format(new Date(lead.created_at), "d MMM yyyy")}
            </span>
            <div className="flex gap-1.5">
              {/* AI Follow-up — compact, 44px min tap */}
              <Button
                variant="outline"
                className="h-9 min-w-[44px] gap-1.5 rounded-lg px-3 text-[12px] transition-colors duration-150"
                onClick={() => onAiFollowUp(lead)}
              >
                <Sparkles className="size-3.5 text-primary" />
                AI Follow-up
              </Button>
              {/* Delete — ghost icon-only, 44px tap */}
              <Button
                variant="ghost"
                aria-label={`Delete ${lead.name}`}
                className="h-9 w-9 rounded-lg p-0 text-muted-foreground/60 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(lead)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
