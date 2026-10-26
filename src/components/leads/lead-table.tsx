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

export function LeadTable({
  leads,
  onStatusChange,
  onAiFollowUp,
  onDelete,
  onFollowUpChange,
}: LeadTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell className="tabular-nums">{lead.mobile}</TableCell>
              <TableCell>{lead.business_name ?? "—"}</TableCell>
              <TableCell>{lead.city ?? "—"}</TableCell>
              <TableCell className="max-w-[180px] truncate">
                {lead.service}
              </TableCell>
              <TableCell>
                <StatusSelect
                  value={lead.status}
                  onValueChange={(status) => onStatusChange(lead, status)}
                />
              </TableCell>
              <TableCell>
                <FollowUpDateInput
                  lead={lead}
                  onChange={(date) => onFollowUpChange(lead, date)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {format(new Date(lead.created_at), "d MMM yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => onAiFollowUp(lead)}
                  >
                    <Sparkles className="size-4 text-primary" />
                    AI Follow-up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${lead.name}`}
                    className="h-9 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(lead)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
