import { Download, FileUp, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { importInChunks, SAMPLE_CSV, validateImportRows, type ImportRow } from "@/lib/lead-import";
import type { Lead } from "@/lib/leads";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
}

export function ImportLeadsDialog({ open, onOpenChange, leads }: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState<unknown[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [savedRowNumbers, setSavedRowNumbers] = useState<number[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = reading || importing;
  const rows = useMemo(() => matrix ? validateImportRows(matrix, leads) : [], [matrix, leads]);
  const pendingRows = rows.filter((row) => !savedRowNumbers.includes(row.rowNumber));
  const valid = pendingRows.filter((row) => row.status === "Valid");
  const invalidCount = pendingRows.filter((row) => row.status === "Invalid").length;
  const duplicateCount = pendingRows.filter((row) => row.status === "Duplicate").length;

  function changeOpen(next: boolean) {
    if (busy) return;
    if (!next) {
      setMatrix(null); setFileName(""); setError(null); setCompleted(0); setTotal(0); setSavedRowNumbers([]);
    }
    onOpenChange(next);
  }

  async function readFile(file: File) {
    setMatrix(null); setError(null); setFileName(file.name); setCompleted(0); setTotal(0); setSavedRowNumbers([]);
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setError("Choose a .csv or .xlsx file."); return;
    }
    if (!file.size) { setError("The file is empty."); return; }
    setReading(true);
    try {
      const XLSX = await import("xlsx");
      let workbook;
      try {
        const buffer = await file.arrayBuffer();
        // Reject unrelated files that SheetJS would otherwise treat as plain text.
        if (/\.xlsx$/i.test(file.name) && new Uint8Array(buffer).slice(0, 2).join(",") !== "80,75") {
          throw new Error("Not an Excel workbook");
        }
        workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: true });
      } catch {
        throw new Error("Could not read this file. Please upload a readable CSV or Excel workbook.");
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
      if (!sheet) throw new Error("The file is empty.");
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
      validateImportRows(data, leads);
      setMatrix(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this file. Please try another file.");
    } finally {
      setReading(false);
    }
  }

  function downloadSample() {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "lead-manager-sample.csv"; link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (busy || !valid.length) return;
    // Recheck against the current shared cache immediately before writing.
    const latest = queryClient.getQueryData<Lead[]>(["leads"]) ?? leads;
    const candidates: ImportRow[] = matrix ? validateImportRows(matrix, latest).filter((row) => row.status === "Valid" && !savedRowNumbers.includes(row.rowNumber)) : [];
    if (!candidates.length) return;
    setImporting(true); setError(null); setCompleted(0); setTotal(candidates.length);
    let savedCount = 0;
    try {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      await importInChunks(candidates.map((row) => row.lead), async (chunk) => {
        const { data, error: insertError } = await supabase.from("leads").insert(chunk).select("*");
        if (insertError) throw new Error(insertError.message);
        if (!data || data.length !== chunk.length) throw new Error("The saved leads could not be confirmed. Refresh the list before retrying.");
        return data as Lead[];
      }, (saved, count) => {
        queryClient.setQueryData<Lead[]>(["leads"], (old) => {
          const ids = new Set(saved.map((lead) => lead.id));
          return [...saved, ...(old ?? []).filter((lead) => !ids.has(lead.id))];
        });
        const newlySaved = candidates.slice(savedCount, count).map((row) => row.rowNumber);
        setSavedRowNumbers((old) => [...old, ...newlySaved]);
        savedCount = count; setCompleted(count);
      });
      toast.success(`${savedCount} ${savedCount === 1 ? "lead" : "leads"} imported`);
    } catch {
      setError(savedCount ? `${savedCount} leads were imported before the import stopped. Retry to import only the remaining valid rows.` : "Could not import the leads. Please try again.");
      toast.error("Import could not be completed");
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 md:max-w-4xl max-md:h-dvh max-md:max-h-dvh max-md:max-w-none max-md:rounded-none max-md:p-4" onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>Import leads</DialogTitle>
          <DialogDescription>{fileName || "CSV or Excel workbook"}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Input ref={fileInput} type="file" id="lead-import-file" accept=".csv,.xlsx" className="sr-only" disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = "";
            }} />
            <Button variant="outline" className="h-11" disabled={busy} onClick={() => fileInput.current?.click()}>
              {reading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
              {matrix ? "Choose another file" : "Upload file"}
            </Button>
            <Label htmlFor="lead-import-file" className="sr-only">Upload leads file</Label>
            <Button variant="link" className="h-11 whitespace-normal" onClick={downloadSample}><Download className="size-4 shrink-0" />Download sample CSV</Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {rows.length > 0 && <>
            <p aria-live="polite" className="text-sm font-medium">{valid.length} valid, {invalidCount} invalid, {duplicateCount} duplicate{savedRowNumbers.length > 0 ? ` · ${savedRowNumbers.length} imported` : ""}</p>
            <div className="min-h-0 overflow-y-auto rounded-lg border">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 bg-muted text-left"><tr>
                  <th className="w-10 p-2 font-medium">Row</th>
                  <th className="p-2 font-medium">Lead</th>
                  <th className="hidden p-2 font-medium md:table-cell">Details</th>
                  <th className="w-[36%] p-2 font-medium md:w-[26%]">Status</th>
                </tr></thead>
                <tbody>{rows.map((row) => {
                  const saved = savedRowNumbers.includes(row.rowNumber);
                  return <tr key={row.rowNumber} className="border-t align-top">
                    <td className="p-2 text-muted-foreground">{row.rowNumber}</td>
                    <td className="break-words p-2"><p className="font-medium">{row.lead.name || "—"}</p><p className="break-all text-muted-foreground">{row.lead.mobile || "—"}</p><p className="text-muted-foreground">{row.lead.service || "—"}</p></td>
                    <td className="hidden break-words p-2 text-muted-foreground md:table-cell">{row.lead.business_name && <p>{row.lead.business_name}</p>}{row.lead.city && <p>{row.lead.city}</p>}{row.lead.notes && <p>{row.lead.notes}</p>}{row.lead.follow_up_date && <p>{row.lead.follow_up_date}</p>}</td>
                    <td className="break-words p-2"><p className={saved || row.status === "Valid" ? "font-medium text-primary" : row.status === "Invalid" ? "font-medium text-destructive" : "font-medium text-muted-foreground"}>{saved ? "Imported" : row.status}</p>{!saved && row.reason && <p className="mt-1 text-xs text-muted-foreground">{row.reason}</p>}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </>}
        </div>
        {total > 0 && <div className="shrink-0 space-y-2" aria-live="polite"><p className="text-sm">{completed} of {total} leads imported</p><Progress value={completed / total * 100} aria-label="Import progress" /></div>}
        <DialogFooter className="shrink-0 gap-2">
          <Button variant="outline" className="h-11" disabled={busy} onClick={() => changeOpen(false)}>{savedRowNumbers.length ? "Done" : "Cancel"}</Button>
          <Button className="h-11" disabled={busy || !valid.length} onClick={() => void handleImport()}>{importing && <Loader2 className="size-4 animate-spin" />}Import {valid.length} leads</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}