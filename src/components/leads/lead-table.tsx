import { format } from "date-fns";
import { Sparkles, Trash2 } from "lucide-react";

import { FollowUpDateInput } from "@/components/leads/follow-up-date";
import { StatusSelect } from "@/components/leads/status";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead } from "@/lib/leads";

interface LeadTableProps {
  leads: Lead[];
  onStatusChange: (lead: Lead, status: string) => void;
  onAiFollowUp: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onFollowUpChange: (lead: Lead, date: string | null) => void;
  pendingStatusId?: string | null;
}

/**
 * Smart name renderer:
 * - ≤ limit chars → single line (whitespace-nowrap)
 * - > limit chars → everything except last word on line 1, last word on line 2
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

export function LeadTable({
  leads,
  onStatusChange,
  onAiFollowUp,
  onDelete,
  onFollowUpChange,
}: LeadTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Allow horizontal scroll only inside if needed on smaller viewports */}
      <div className="overflow-x-auto">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Mobile
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Business
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                City
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Service
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Follow-up
              </TableHead>
              <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="h-9 px-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="group h-12 border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
              >
                {/* Name — smart wrapping at 18 chars */}
                <TableCell className="px-3 py-2 text-[13px] font-medium">
                  <SmartName text={lead.name} limit={18} />
                </TableCell>

                {/* Mobile — monospace, no wrap */}
                <TableCell className="px-3 py-2 text-[13px] tabular-nums">
                  <span className="whitespace-nowrap font-mono tracking-tight">
                    {lead.mobile}
                  </span>
                </TableCell>

                {/* Business — smart wrapping at 22 chars */}
                <TableCell className="px-3 py-2 text-[13px]">
                  {lead.business_name ? (
                    <SmartName text={lead.business_name} limit={22} />
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* City — truncate with tooltip; min 11 chars visible */}
                <TableCell
                  className="min-w-[104px] max-w-[104px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 text-[13px]"
                  title={lead.city ?? undefined}
                >
                  {lead.city ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Service — truncate with tooltip */}
                <TableCell
                  className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 text-[13px]"
                  title={lead.service}
                >
                  {lead.service}
                </TableCell>

                <TableCell className="px-3 py-2">
                  <StatusSelect
                    value={lead.status}
                    onValueChange={(status) => onStatusChange(lead, status)}
                  />
                </TableCell>

                <TableCell className="px-3 py-2">
                  <FollowUpDateInput
                    lead={lead}
                    onChange={(date) => onFollowUpChange(lead, date)}
                  />
                </TableCell>

                {/* Created — no wrap */}
                <TableCell className="whitespace-nowrap px-3 py-2 text-[12px] text-muted-foreground">
                  {format(new Date(lead.created_at), "d MMM yyyy")}
                </TableCell>

                {/* Actions */}
                <TableCell className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {/* Compact AI button: icon+"AI" on small widths, "AI Follow-up" on large */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-primary/8 hover:text-primary"
                      onClick={() => onAiFollowUp(lead)}
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      <span className="hidden lg:inline">AI Follow-up</span>
                      <span className="lg:hidden">AI</span>
                    </Button>
                    {/* Ghost icon-only delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${lead.name}`}
                      className="h-7 w-7 p-0 text-muted-foreground/60 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(lead)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
