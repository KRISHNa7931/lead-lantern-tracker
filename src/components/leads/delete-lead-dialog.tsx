import { Loader2 } from "lucide-react";

import type { Lead } from "@/lib/leads";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteLeadDialogProps {
  lead: Lead | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lead: Lead) => void;
}

/** Controlled by the parent: open while `lead` is set; parent clears it when the delete finishes. */
export function DeleteLeadDialog({ lead, deleting, onOpenChange, onConfirm }: DeleteLeadDialogProps) {
  return (
    <AlertDialog
      open={lead !== null}
      onOpenChange={(open) => {
        if (!deleting) onOpenChange(open);
      }}
    >
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete lead?</AlertDialogTitle>
          <AlertDialogDescription>
            {lead
              ? `This permanently removes ${lead.name} (${lead.mobile}) from the team's leads.`
              : "This permanently removes the lead from the team's leads."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="h-11 sm:h-10" disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            className="h-11 sm:h-10"
            disabled={deleting}
            onClick={() => lead && onConfirm(lead)}
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
