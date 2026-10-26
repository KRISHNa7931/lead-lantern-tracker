import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { AiFollowupDialog } from "@/components/leads/ai-followup-dialog";
import { DashboardCards } from "@/components/leads/dashboard-cards";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import { LeadCards } from "@/components/leads/lead-cards";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadsToolbar, type LeadFilters } from "@/components/leads/leads-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  useDeleteLead,
  useLeads,
  useUpdateLeadStatus,
} from "@/hooks/use-leads";
import type { Lead } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/")({
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

  const [filters, setFilters] = useState<LeadFilters>({
    search: "",
    status: null,
    service: null,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [aiLead, setAiLead] = useState<Lead | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<Lead | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const digits = filters.search.replace(/\D/g, "");
    return leads.filter((lead) => {
      if (
        term &&
        !lead.name.toLowerCase().includes(term) &&
        !(digits && lead.mobile.includes(digits))
      ) {
        return false;
      }
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.service && lead.service !== filters.service) return false;
      return true;
    });
  }, [leads, filters]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const emptyFilters =
    filters.search.trim() === "" &&
    filters.status === null &&
    filters.service === null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Users className="size-4.5 text-primary-foreground" />
            </span>
            <span className="truncate text-base font-semibold tracking-tight">
              Lead Manager
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[220px] truncate text-sm text-muted-foreground sm:inline">
              {userEmail ?? "Team member"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 gap-1.5 px-3 text-muted-foreground hover:text-foreground md:h-9"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-24 md:py-6 md:pb-10">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <Card className="rounded-xl">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="font-medium">Couldn't load your leads</p>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching the team's leads.
              </p>
              <Button className="h-11" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <DashboardCards
              leads={leads}
              selectedStatus={filters.status}
              onSelectStatus={(status) =>
                setFilters((current) => ({ ...current, status }))
              }
            />

            <LeadsToolbar
              filters={filters}
              onFiltersChange={setFilters}
              onAddLead={() => setAddOpen(true)}
            />

            {leads.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="font-medium">No leads yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first lead to start tracking follow-ups.
                  </p>
                  <Button className="h-11" onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" />
                    Add lead
                  </Button>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="font-medium">No leads match your filters</p>
                  {!emptyFilters && (
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() =>
                        setFilters({ search: "", status: null, service: null })
                      }
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
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
        className="fixed right-5 bottom-5 z-10 size-14 rounded-full shadow-lg md:hidden"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="size-6" />
      </Button>

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
      <AiFollowupDialog
        lead={aiLead}
        open={aiLead !== null}
        onOpenChange={(open) => {
          if (!open) setAiLead(null);
        }}
      />
      <DeleteLeadDialog
        lead={deleteLeadTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteLeadTarget(null);
        }}
        onConfirm={(lead) => deleteLead.mutate(lead.id)}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[64px] rounded-xl md:h-[72px]" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-lg" />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[132px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
