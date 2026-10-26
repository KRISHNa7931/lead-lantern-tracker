import { format } from "date-fns";
import { Sparkles, Trash2 } from "lucide-react";

import { FollowUpDateInput } from "@/components/leads/follow-up-date";
import { StatusSelect } from "@/components/leads/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@/lib/leads";

interface LeadCardsProps {
  leads: Lead[];
  onStatusChange: (lead: Lead, status: string) => void;
  onAiFollowUp: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onFollowUpChange: (lead: Lead, date: string | null) => void;
}

/** Mobile lead cards — everything stacks and wraps, no horizontal scrolling. */
export function LeadCards({
  leads,
  onStatusChange,
  onAiFollowUp,
  onDelete,
  onFollowUpChange,
}: LeadCardsProps) {
  return (
    <div className="space-y-2.5">
      {leads.map((lead) => (
        <Card key={lead.id} className="rounded-xl py-0">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
              <div className="min-w-0">
                <p className="font-medium break-words">{lead.name}</p>
                <p className="text-sm text-muted-foreground break-words">
                  {lead.business_name ?? "—"}
                </p>
              </div>
              <StatusSelect
                value={lead.status}
                onValueChange={(status) => onStatusChange(lead, status)}
                className="shrink-0"
              />
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <span className="tabular-nums">{lead.mobile}</span>
              <span className="text-muted-foreground">{lead.city ?? "—"}</span>
              <span className="break-words text-muted-foreground">{lead.service}</span>
            </div>

            {lead.notes && (
              <p className="line-clamp-2 text-sm break-words text-muted-foreground">
                {lead.notes}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Follow-up</span>
              <FollowUpDateInput
                lead={lead}
                onChange={(date) => onFollowUpChange(lead, date)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Added {format(new Date(lead.created_at), "d MMM yyyy")}
              </span>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  className="h-11 flex-1 gap-1.5 text-sm"
                  onClick={() => onAiFollowUp(lead)}
                >
                  <Sparkles className="size-4 text-primary" />
                  AI Follow-up
                </Button>
                <Button
                  variant="outline"
                  aria-label={`Delete ${lead.name}`}
                  className="h-11 px-3 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(lead)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
