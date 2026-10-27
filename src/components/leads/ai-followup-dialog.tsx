import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/leads/status";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Language = "Hinglish" | "English";

interface AiFollowupDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiFollowupDialog({
  lead,
  open,
  onOpenChange,
}: AiFollowupDialogProps) {
  const [language, setLanguage] = useState<Language>("Hinglish");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // Fresh state whenever a different lead opens the modal.
  useEffect(() => {
    setMessage("");
    setError(null);
    setLoading(false);
    setGenerated(false);
  }, [lead?.id]);

  async function generate() {
    if (!lead || loading) return;
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/generate-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: lead.name,
          businessName: lead.business_name,
          city: lead.city,
          service: lead.service,
          status: lead.status,
          notes: lead.notes,
          language,
        }),
      });

      if (res.status === 404) {
        setError("AI is available on the deployed site. It can't run in the editor preview.");
        return;
      }
      if (res.status === 401) {
        setError("Your session expired. Please log in again.");
        return;
      }
      if (res.status === 429 || res.status === 502) {
        setError("The AI service is busy. Please try again in a moment.");
        return;
      }

      const payload = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(payload?.error || "Something went wrong. Please try again.");
        return;
      }
      if (!payload?.message) {
        setError("The AI returned an empty message. Please try again.");
        return;
      }
      setMessage(payload.message);
      setGenerated(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[100dvh] flex-col gap-4 overflow-y-auto rounded-xl p-5 sm:max-w-lg max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-full max-md:max-w-full max-md:rounded-none max-md:border-0">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-[15px] font-semibold">
            {lead?.name}
            {lead && <StatusBadge status={lead.status} />}
          </DialogTitle>
          <DialogDescription className="pr-6 text-[13px]">
            {lead?.service}
            {lead?.city ? ` · ${lead.city}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Language toggle — small segmented control + Generate button */}
        <div className="flex items-center justify-between gap-3">
          {/* Compact segmented control */}
          <Tabs
            value={language}
            onValueChange={(value) => setLanguage(value as Language)}
          >
            <TabsList className="h-8 gap-0.5 p-0.5">
              <TabsTrigger
                value="Hinglish"
                className="h-7 rounded-md px-3 text-[12px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Hinglish
              </TabsTrigger>
              <TabsTrigger
                value="English"
                className="h-7 rounded-md px-3 text-[12px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                English
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-[13px] transition-colors duration-150"
            onClick={generate}
            disabled={loading}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {generated ? "Regenerate" : "Generate with AI"}
          </Button>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/8 px-3 py-2 text-[12px] text-destructive" role="alert">
            {error}
          </p>
        )}

        {/* Message textarea — comfortable, soft border */}
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="The AI message will appear here — or write your own."
          className={cn(
            "min-h-[160px] flex-1 resize-none rounded-lg border-border text-[13px] leading-relaxed",
            "transition-colors duration-150 focus-visible:border-primary/50",
          )}
        />

        {/* Send on WhatsApp — solid green with icon */}
        <Button
          className="h-10 w-full gap-2 rounded-lg bg-whatsapp text-whatsapp-foreground transition-colors duration-150 hover:bg-whatsapp/90"
          disabled={message.trim() === ""}
          onClick={() =>
            lead &&
            openWhatsApp(
              lead.mobile,
              message,
            )
          }
        >
          <MessageCircle className="size-4 fill-current" />
          Send on WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
