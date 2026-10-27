import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LogOut, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { AiFollowupDialog } from "@/components/leads/ai-followup-dialog";
import { DashboardCards } from "@/components/leads/dashboard-cards";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import { LeadCards } from "@/components/leads/lead-cards";
import { LeadTable } from "@/components/leads/lead-table";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { LeadsToolbar, type LeadFilters } from "@/components/leads/leads-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  useDeleteLead,
  useLeads,
  useUpdateLeadFollowUp,
  useUpdateLeadStatus,
} from "@/hooks/use-leads";
import {
  DEFAULT_SORT,
  EMPTY_FILTERS,
  filterLeads,
  hasActiveFilters,
  sortLeads,
  type Lead,
  type SortOption,
} from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/")(  {
  head: () => ({
    meta: [
      { title: "Lead Manager" },
      {
        name: "description",
        content:
          "Track sales leads and follow up on WhatsApp — a team-wide lead manager.",
      },
      { property: "og:title", content: "Lead Manager" },
      {
        property: "og:description",
        content:
          "Track sales leads and follow up on WhatsApp — a team-wide lead manager.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading, isError, refetch } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();
  const updateFollowUp = useUpdateLeadFollowUp();
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);

  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiLead, setAiLead] = useState<Lead | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const filtered = useMemo(
    () => sortLeads(filterLeads(leads, filters), sort),
    [leads, filters, sort],
  );

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const emptyFilters = !hasActiveFilters(filters);

  /** Open the dialog in add mode. */
  function handleAddLead() {
    setEditLead(null);
    setAddOpen(true);
  }

  /** Open the dialog in edit mode with the given lead prefilled. */
  function handleEditLead(lead: Lead) {
    setEditLead(lead);
    setAddOpen(true);
  }

  /** When the add/edit dialog closes, clear the editLead state. */
  function handleDialogOpenChange(open: boolean) {
    setAddOpen(open);
    if (!open) setEditLead(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Slim header: 56px, white, bottom border ── */}
      <header className="sticky top-0 z-10 h-14 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Users className="size-3.5 text-primary-foreground" />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              Lead Manager
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline">
              {userEmail ?? "Team member"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content area ── */}
      <main className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 pb-24 md:px-6 md:py-5 md:pb-10">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Couldn't load your leads</p>
              <p className="text-xs text-muted-foreground">
                Something went wrong while fetching the team's leads.
              </p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <DashboardCards
              leads={leads}
              selectedStatus={filters.status}
              onSelectStatus={(status) =>
                setFilters((current) => ({ ...current, status }))
              }
              selectedDue={filters.due}
              onSelectDue={(due) => setFilters((current) => ({ ...current, due }))}
            />

            <LeadsToolbar
              filters={filters}
              onFiltersChange={setFilters}
              onAddLead={handleAddLead}
              onImport={() => setImportOpen(true)}
              sort={sort}
              onSortChange={setSort}
            />

            {leads.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="size-5 text-primary" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No leads yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add your first lead to get started.
                  </p>
                </div>
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleAddLead}>
                  <Plus className="size-3.5" />
                  Add lead
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No leads match your filters</p>
                  <p className="text-xs text-muted-foreground">
                    Try adjusting or clearing the active filters.
                  </p>
                </div>
                {!emptyFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <LeadTable
                    leads={filtered}
                    onStatusChange={(lead, status) =>
                      updateStatus.mutate({ id: lead.id, status })
                    }
                    onAiFollowUp={setAiLead}
                    onDelete={setDeleteLeadTarget}
                    onEdit={handleEditLead}
                    onFollowUpChange={(lead, follow_up_date) =>
                      updateFollowUp.mutate({ id: lead.id, follow_up_date })
                    }
                  />
                </div>
                <div className="md:hidden">
                  <LeadCards
                    leads={filtered}
                    onStatusChange={(lead, status) =>
                      updateStatus.mutate({ id: lead.id, status })
                    }
                    onAiFollowUp={setAiLead}
                    onDelete={setDeleteLeadTarget}
                    onEdit={handleEditLead}
                    onFollowUpChange={(lead, follow_up_date) =>
                      updateFollowUp.mutate({ id: lead.id, follow_up_date })
                    }
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Floating add button on phones */}
      <Button
        aria-label="Add lead"
        size="icon"
        className="fixed right-5 bottom-5 z-10 size-12 rounded-full shadow-lg transition-transform duration-150 hover:scale-105 md:hidden"
        onClick={handleAddLead}
      >
        <Plus className="size-5" />
      </Button>

      <AddLeadDialog
        open={addOpen}
        onOpenChange={handleDialogOpenChange}
        editLead={editLead}
      />
      <ImportLeadsDialog open={importOpen} onOpenChange={setImportOpen} leads={leads} />
      <AiFollowupDialog
        lead={aiLead}
        open={aiLead !== null}
        onOpenChange={(open) => {
          if (!open) setAiLead(null);
        }}
      />
      <DeleteLeadDialog
        lead={deleteLeadTarget}
        deleting={deleteLead.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteLeadTarget(null);
        }}
        onConfirm={(lead) =>
          deleteLead.mutate(lead.id, {
            onSettled: () => setDeleteLeadTarget(null),
          })
        }
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* 8-card grid skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
      {/* Toolbar skeleton */}
      <Skeleton className="h-9 rounded-lg" />
      {/* Table rows skeleton */}
      <div className="space-y-px overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton className="h-9 rounded-none" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 rounded-none" />
        ))}
      </div>
    </div>
  );
}
