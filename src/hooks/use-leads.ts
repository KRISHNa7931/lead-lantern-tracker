import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/leads";

export interface NewLeadInput {
  name: string;
  mobile: string;
  business_name: string | null;
  city: string | null;
  service: string;
  notes: string | null;
  follow_up_date: string | null;
}

/** Loads every lead once, newest first. Filtering happens in the browser. */
export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Lead[];
    },
  });
}

export function useAddLead(options?: { onSuccess?: (lead: Lead) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewLeadInput): Promise<Lead> => {
      const { data, error } = await supabase
        .from("leads")
        .insert(input)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as Lead;
    },
    onSuccess: (lead) => {
      queryClient.setQueryData<Lead[]>(["leads"], (old) => [lead, ...(old ?? []).filter((l) => l.id !== lead.id)]);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added");
      options?.onSuccess?.(lead);
    },
    onError: () => toast.error("Could not save the lead. Please try again."),
  });
}

/**
 * Optimistic status change: the local list (and therefore the dashboard
 * counts) updates immediately, then rolls back with an error toast if the
 * database update fails.
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previous = queryClient.getQueryData<Lead[]>(["leads"]);
      queryClient.setQueryData<Lead[]>(["leads"], (old) =>
        (old ?? []).map((lead) => (lead.id === id ? { ...lead, status } : lead)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["leads"], context.previous);
      toast.error("Could not update the status. Please try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Lead[]>(["leads"], (old) => (old ?? []).filter((l) => l.id !== id));
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Could not delete the lead. Please try again."),
  });
}

/** Optimistic follow-up date change (null clears it). */
export function useUpdateLeadFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, follow_up_date }: { id: string; follow_up_date: string | null }) => {
      const { error } = await supabase.from("leads").update({ follow_up_date }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, follow_up_date }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previous = queryClient.getQueryData<Lead[]>(["leads"]);
      queryClient.setQueryData<Lead[]>(["leads"], (old) =>
        (old ?? []).map((lead) => (lead.id === id ? { ...lead, follow_up_date } : lead)),
      );
      return { previous };
    },
    onSuccess: (_d, { follow_up_date }) =>
      toast.success(follow_up_date ? "Follow-up date saved" : "Follow-up date cleared"),
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["leads"], context.previous);
      toast.error("Could not update the follow-up date. Please try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}
