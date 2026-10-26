import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAddLead } from "@/hooks/use-leads";
import { SERVICES, normalizeMobile } from "@/lib/leads";
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
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
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

  // Reset everything when the dialog closes.
  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
      setDuplicateName(null);
      setDuplicateMobile(null);
    }
  }, [open, form]);

  async function checkAndSave(values: LeadFormValues) {
    const mobile = normalizeMobile(values.mobile);
    if (!mobile) return;

    if (!duplicateName) {
      const { data } = await supabase
        .from("leads")
        .select("name")
        .eq("mobile", mobile)
        .limit(1);
      if (data && data.length > 0) {
        setDuplicateName((data[0] as { name: string }).name);
        setDuplicateMobile(mobile);
        return;
      }
    }

    setDuplicateName(null);
    setDuplicateMobile(null);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Save a new lead for the team. Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        {duplicateName && (
          <Alert variant="warning">
            <AlertTitle>Duplicate mobile number</AlertTitle>
            <AlertDescription>
              A lead with this number already exists ({duplicateName}). Save
              anyway?
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(checkAndSave)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Rohan Mehta"
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile *</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="tel"
                      placeholder="98765 43210"
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mehta Sweets"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jamnagar"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything the team should know…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              {duplicateName && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => setDuplicateName(null)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className="h-11 flex-1 sm:flex-none"
                disabled={addLead.isPending}
              >
                {addLead.isPending ? "Saving…" : duplicateName ? "Save anyway" : "Save lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
