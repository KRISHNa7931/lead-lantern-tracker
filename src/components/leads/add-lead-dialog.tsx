import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAddLead, useUpdateLead } from "@/hooks/use-leads";
import { SERVICES, normalizeMobile } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .refine(
      (value) => normalizeMobile(value) !== null,
      "Enter a valid 10-digit mobile number",
    ),
  business_name: z.string().optional(),
  city: z.string().optional(),
  service: z.string().min(1, "Please choose a service"),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const emptyValues: LeadFormValues = {
  name: "",
  mobile: "",
  business_name: "",
  city: "",
  service: "",
  notes: "",
  follow_up_date: "",
};

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog operates in edit mode. */
  editLead?: Lead | null;
}

export function AddLeadDialog({ open, onOpenChange, editLead }: AddLeadDialogProps) {
  const isEdit = !!editLead;
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [duplicateMobile, setDuplicateMobile] = useState<string | null>(null);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyValues,
  });
  const addLead = useAddLead({
    onSuccess: () => {
      form.reset(emptyValues);
      setDuplicateName(null);
      setDuplicateMobile(null);
      onOpenChange(false);
    },
  });
  const updateLead = useUpdateLead({
    onSuccess: () => {
      form.reset(emptyValues);
      setDuplicateName(null);
      setDuplicateMobile(null);
      onOpenChange(false);
    },
  });

  const isPending = isEdit ? updateLead.isPending : addLead.isPending;

  // Reset / prefill when the dialog opens or closes, or when editLead changes.
  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
      setDuplicateName(null);
      setDuplicateMobile(null);
      return;
    }
    if (editLead) {
      form.reset({
        name: editLead.name,
        mobile: editLead.mobile,
        business_name: editLead.business_name ?? "",
        city: editLead.city ?? "",
        service: editLead.service,
        notes: editLead.notes ?? "",
        follow_up_date: editLead.follow_up_date ?? "",
      });
    } else {
      form.reset(emptyValues);
    }
    setDuplicateName(null);
    setDuplicateMobile(null);
  }, [open, editLead, form]);

  async function checkAndSave(values: LeadFormValues) {
    const mobile = normalizeMobile(values.mobile);
    if (!mobile) return;

    if (!duplicateName) {
      let query = supabase
        .from("leads")
        .select("name")
        .eq("mobile", mobile)
        .limit(1);
      // In edit mode, ignore the lead currently being edited.
      if (editLead) {
        query = query.neq("id", editLead.id);
      }
      const { data } = await query;
      if (data && data.length > 0) {
        setDuplicateName((data[0] as { name: string }).name);
        setDuplicateMobile(mobile);
        return;
      }
    }

    setDuplicateName(null);
    setDuplicateMobile(null);

    if (isEdit) {
      updateLead.mutate({
        id: editLead.id,
        name: values.name,
        mobile,
        business_name: values.business_name?.trim() || null,
        city: values.city?.trim() || null,
        service: values.service,
        notes: values.notes?.trim() || null,
      });
    } else {
      addLead.mutate({
        name: values.name,
        mobile,
        business_name: values.business_name?.trim() || null,
        city: values.city?.trim() || null,
        service: values.service,
        notes: values.notes?.trim() || null,
        follow_up_date: values.follow_up_date || null,
      });
    }
  }

  void duplicateMobile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto rounded-xl p-5 sm:max-w-md max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-full max-md:max-w-full max-md:rounded-none">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-[15px] font-semibold">
            {isEdit ? "Edit lead" : "Add lead"}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {isEdit
              ? "Update this lead's details. Fields marked * are required."
              : "Save a new lead for the team. Fields marked * are required."}
          </DialogDescription>
        </DialogHeader>

        {duplicateName && (
          <Alert variant="warning" className="rounded-lg py-3">
            <AlertTitle className="text-[13px] font-semibold">Duplicate mobile number</AlertTitle>
            <AlertDescription className="text-[12px]">
              A lead with this number already exists ({duplicateName}). Save anyway?
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(checkAndSave)}
            className="space-y-3.5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-medium text-muted-foreground">Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Rohan Mehta"
                      {...field}
                      className="h-9 rounded-lg text-[13px]"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-medium text-muted-foreground">Mobile *</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="tel"
                      placeholder="98765 43210"
                      {...field}
                      className="h-9 rounded-lg text-[13px] tabular-nums"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[12px] font-medium text-muted-foreground">Business name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mehta Sweets"
                        {...field}
                        className="h-9 rounded-lg text-[13px]"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[12px] font-medium text-muted-foreground">City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jamnagar"
                        {...field}
                        className="h-9 rounded-lg text-[13px]"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-medium text-muted-foreground">Service *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 w-full rounded-lg text-[13px]">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICES.map((service) => (
                        <SelectItem key={service} value={service} className="text-[13px]">
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Follow-up date is only shown in add mode; edit mode does not touch it */}
            {!isEdit && (
              <FormField
                control={form.control}
                name="follow_up_date"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[12px] font-medium text-muted-foreground">Follow-up date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-9 rounded-lg text-[13px]" />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[12px] font-medium text-muted-foreground">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything the team should know…"
                      rows={3}
                      className="rounded-lg text-[13px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-1 sm:gap-2">
              {duplicateName && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg text-[13px]"
                  onClick={() => setDuplicateName(null)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="h-9 flex-1 rounded-lg text-[13px] sm:flex-none"
                disabled={isPending}
              >
                {isPending
                  ? "Saving…"
                  : duplicateName
                    ? "Save anyway"
                    : isEdit
                      ? "Save changes"
                      : "Save lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
