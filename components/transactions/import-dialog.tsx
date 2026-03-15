"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { importTransactions, ImportResult } from "@/lib/api/transactions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const mutation = useMutation({
    mutationFn: importTransactions,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    mutation.reset();
  }

  function handleImport() {
    if (selectedFile) mutation.mutate(selectedFile);
  }

  function handleClose() {
    setSelectedFile(null);
    setResult(null);
    mutation.reset();
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Import from Money Lover</DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from Money Lover. Categories and wallets will be created
            automatically if they don&apos;t exist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {selectedFile ? (
              <>
                <FileText className="size-8 text-primary" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {mutation.isError && (
            <div className="flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{(mutation.error as Error)?.message ?? "Import failed"}</span>
            </div>
          )}

          {result && (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4 text-green-500" />
                Import complete
              </div>
              <p className="text-sm text-muted-foreground">
                {result.imported} imported, {result.skipped} skipped
              </p>
              {result.errors.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5 mt-1">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                onClick={handleImport}
                disabled={!selectedFile || mutation.isPending}
              >
                {mutation.isPending ? "Importing…" : "Import"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
