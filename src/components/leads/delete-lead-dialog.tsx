import { useState } from "react";

import type { Lead } from "@/lib/leads";
import {
  AlertDialog,
  AlertDialogAction,
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
  onOpenChange: (open: boolean) => void;
  onConfirm: (lead: Lead) => void;
}

export function DeleteLeadDialog({
  lead,
  onOpenChange,
  onConfirm,
}: DeleteLeadDialogProps) {
  const [deleting, setDeleting] = useState(false);

  return (
    <AlertDialog open={lead !== null} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel className="h-11 sm:h-10">Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              className="h-11 sm:h-10"
              disabled={deleting}
              onClick={async (event) => {
                event.preventDefault();
                if (!lead) return;
                setDeleting(true);
                onConfirm(lead);
                setDeleting(false);
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
