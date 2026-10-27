import { format } from "date-fns";
import { Pencil, Sparkles, Trash2 } from "lucide-react";

import { FollowUpDateInput } from "@/components/leads/follow-up-date";
import { StatusSelect } from "@/components/leads/status";
import { Button } from "@/components/ui/button";
import {
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
  onEdit: (lead: Lead) => void;
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

/* ── Shared cell class fragments ───────────────────── */
const thBase =
  "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-slate-50/80";

export function LeadTable({
  leads,
  onStatusChange,
  onAiFollowUp,
  onDelete,
  onEdit,
  onFollowUpChange,
}: LeadTableProps) {
  return (
    /*
     * Card wrapper.
     * < 1320 px: overflow-hidden so the inner container can scroll horizontally.
     * ≥ 1320 px: overflow-visible so the absolute-positioned trash / pencil
     *            buttons in the page margins are not clipped.
     */
    <div className="overflow-hidden rounded-xl border border-border bg-card min-[1320px]:overflow-visible">
      {/* Inner scroll container — same breakpoint logic */}
      <div className="overflow-x-auto min-[1320px]:overflow-visible">
        {/*
         * Plain <table> instead of the shadcn <Table> wrapper, which adds its
         * own overflow-auto div and would clip the external trash button.
         */}
        <table className="w-full min-w-[860px] caption-bottom text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${thBase} min-[1320px]:rounded-tl-xl`}>
                Name
              </TableHead>
              <TableHead className={thBase}>Mobile</TableHead>
              <TableHead className={thBase}>Business</TableHead>
              <TableHead className={thBase}>City</TableHead>
              <TableHead className={thBase}>Service</TableHead>
              <TableHead className={thBase}>Status</TableHead>
              <TableHead className={thBase}>Follow-up</TableHead>
              <TableHead className={thBase}>Created</TableHead>
              <TableHead
                className={`${thBase} min-[1320px]:rounded-tr-xl`}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead, index) => {
              const isLast = index === leads.length - 1;
              return (
                <TableRow
                  key={lead.id}
                  className="group h-12 border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                >
                  {/* Name — smart wrapping at 18 chars */}
                  <TableCell
                    className={`relative px-2.5 py-2 text-[13px] font-medium ${isLast ? "min-[1320px]:rounded-bl-xl" : ""}`}
                  >
                    {/*
                     * Pencil edit — OUTSIDE the card on wide screens (≥ 1320px).
                     * Mirrors the trash button's pattern: absolutely positioned
                     * from the first cell, pointing to the LEFT margin via right-full.
                     */}
                    <div className="pointer-events-none absolute top-0 right-full hidden h-full w-10 items-center justify-end pr-2 min-[1320px]:flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Edit lead"
                        title="Edit"
                        className="pointer-events-auto h-7 w-7 p-0 text-muted-foreground/60 opacity-0 transition-all duration-150 hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={() => onEdit(lead)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>

                    {/*
                     * Pencil edit — INSIDE the Name cell on mid screens (768–1319px).
                     * Absolutely positioned at left edge, vertically centered,
                     * hidden by default, shown on row hover / keyboard focus.
                     */}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit lead"
                      title="Edit"
                      className="absolute top-1/2 left-0.5 z-10 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground/60 opacity-0 transition-all duration-150 hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 min-[1320px]:hidden"
                      onClick={() => onEdit(lead)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>

                    <SmartName text={lead.name} limit={18} />
                  </TableCell>

                  {/* Mobile — monospace, no wrap */}
                  <TableCell className="px-2.5 py-2 text-[13px] tabular-nums">
                    <span className="whitespace-nowrap font-mono tracking-tight">
                      {lead.mobile}
                    </span>
                  </TableCell>

                  {/* Business — smart wrapping at 22 chars */}
                  <TableCell className="px-2.5 py-2 text-[13px]">
                    {lead.business_name ? (
                      <SmartName text={lead.business_name} limit={22} />
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* City — truncate with tooltip; min 11 chars visible */}
                  <TableCell
                    className="min-w-[104px] max-w-[104px] overflow-hidden text-ellipsis whitespace-nowrap px-2.5 py-2 text-[13px]"
                    title={lead.city ?? undefined}
                  >
                    {lead.city ?? (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Service — truncate with tooltip */}
                  <TableCell
                    className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap px-2.5 py-2 text-[13px]"
                    title={lead.service}
                  >
                    {lead.service}
                  </TableCell>

                  <TableCell className="px-2.5 py-2">
                    <StatusSelect
                      value={lead.status}
                      onValueChange={(status) =>
                        onStatusChange(lead, status)
                      }
                    />
                  </TableCell>

                  <TableCell className="px-2.5 py-2">
                    <FollowUpDateInput
                      lead={lead}
                      onChange={(date) => onFollowUpChange(lead, date)}
                    />
                  </TableCell>

                  {/* Created — no wrap */}
                  <TableCell className="whitespace-nowrap px-2.5 py-2 text-[12px] text-muted-foreground">
                    {format(new Date(lead.created_at), "d MMM yyyy")}
                  </TableCell>

                  {/* ── Actions cell ── */}
                  <TableCell
                    className={`relative px-2.5 py-2 ${isLast ? "min-[1320px]:rounded-br-xl" : ""}`}
                  >
                    <div className="flex items-center justify-start gap-1">
                      {/* AI Follow-up button — always visible */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-7 gap-1 px-2 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-primary/8 hover:text-primary"
                        onClick={() => onAiFollowUp(lead)}
                      >
                        <Sparkles className="size-3.5 text-primary" />
                        <span className="hidden lg:inline">AI Follow-up</span>
                        <span className="lg:hidden">AI</span>
                      </Button>

                      {/*
                       * Trash button — INSIDE the cell on narrow screens,
                       * rendered twice: once inline (< 1320), once absolute
                       * (≥ 1320). Only one is visible at any breakpoint.
                       */}

                      {/* Inline trash: shown below 1320px */}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${lead.name}`}
                        className="h-7 w-7 p-0 text-muted-foreground/60 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive min-[1320px]:hidden"
                        onClick={() => onDelete(lead)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/*
                     * Absolute trash: shown at ≥ 1320px, positioned outside
                     * the right edge of the table card. Invisible by default,
                     * visible on row hover or keyboard focus within.
                     */}
                    <div className="pointer-events-none absolute top-0 left-full hidden h-full w-10 items-center pl-2 min-[1320px]:flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${lead.name}`}
                        className="pointer-events-auto h-7 w-7 p-0 text-muted-foreground/60 opacity-0 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={() => onDelete(lead)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
