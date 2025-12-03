import { useState, useMemo } from "react";
import type { StockItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Check, AlertCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedItem {
  reference: string;
  name: string;
  currentStock: number;
  pendingArrival: number;
  threshold: number;
  unit: string;
  location: string;
  valid: boolean;
  error?: string;
}

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedItems: ParsedItem[];
  onConfirmImport: () => void;
}

export function CSVImportModal({
  open,
  onOpenChange,
  parsedItems,
  onConfirmImport,
}: CSVImportModalProps) {
  const stats = useMemo(() => {
    const valid = parsedItems.filter((i) => i.valid).length;
    const invalid = parsedItems.filter((i) => !i.valid).length;
    return { valid, invalid, total: parsedItems.length };
  }, [parsedItems]);

  const handleConfirm = () => {
    onConfirmImport();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Aperçu de l'import CSV
          </DialogTitle>
          <DialogDescription>
            Vérifiez les données avant de confirmer l'import
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            {stats.valid} valide{stats.valid > 1 ? "s" : ""}
          </Badge>
          {stats.invalid > 0 && (
            <Badge variant="outline" className="gap-1.5 bg-destructive/10 text-destructive">
              <AlertCircle className="h-3 w-3" />
              {stats.invalid} erreur{stats.invalid > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-10"></TableHead>
                  <TableHead className="font-semibold">Référence</TableHead>
                  <TableHead className="font-semibold">Article</TableHead>
                  <TableHead className="font-semibold text-right">Stock</TableHead>
                  <TableHead className="font-semibold text-right">Arrivage</TableHead>
                  <TableHead className="font-semibold text-right">Seuil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedItems.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn(!item.valid && "bg-destructive/5")}
                  >
                    <TableCell>
                      {item.valid ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.reference || "-"}</TableCell>
                    <TableCell className="font-medium">{item.name || "-"}</TableCell>
                    <TableCell className="text-right font-mono">{item.currentStock}</TableCell>
                    <TableCell className="text-right font-mono">{item.pendingArrival || "-"}</TableCell>
                    <TableCell className="text-right font-mono">{item.threshold || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 mt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {stats.valid} article{stats.valid > 1 ? "s" : ""} sera{stats.valid > 1 ? "ont" : ""} importé{stats.valid > 1 ? "s" : ""}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-import">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={stats.valid === 0}
            className="gap-2"
            data-testid="button-confirm-import"
          >
            <Upload className="h-4 w-4" />
            Importer {stats.valid} article{stats.valid > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function parseCSV(content: string): ParsedItem[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.trim().toLowerCase());
  
  const refIndex = headers.findIndex((h) => h.includes("ref") || h.includes("réf"));
  const nameIndex = headers.findIndex((h) => h.includes("nom") || h.includes("article") || h.includes("désignation"));
  const stockIndex = headers.findIndex((h) => h.includes("stock") || h.includes("quantité") || h.includes("qte"));
  const arrivalIndex = headers.findIndex((h) => h.includes("arrivage") || h.includes("commande") || h.includes("attente"));
  const thresholdIndex = headers.findIndex((h) => h.includes("seuil") || h.includes("minimum") || h.includes("min"));
  const unitIndex = headers.findIndex((h) => h.includes("unité") || h.includes("unite"));
  const locationIndex = headers.findIndex((h) => h.includes("emplacement") || h.includes("location") || h.includes("lieu"));

  return lines.slice(1).map((line) => {
    const values = line.split(";").map((v) => v.trim());
    
    const reference = refIndex >= 0 ? values[refIndex] || "" : "";
    const name = nameIndex >= 0 ? values[nameIndex] || "" : "";
    const currentStock = stockIndex >= 0 ? parseInt(values[stockIndex], 10) || 0 : 0;
    const pendingArrival = arrivalIndex >= 0 ? parseInt(values[arrivalIndex], 10) || 0 : 0;
    const threshold = thresholdIndex >= 0 ? parseInt(values[thresholdIndex], 10) || 0 : 0;
    const unit = unitIndex >= 0 ? values[unitIndex] || "unités" : "unités";
    const location = locationIndex >= 0 ? values[locationIndex] || "" : "";

    const valid = reference.length > 0 && name.length > 0;
    const error = !valid ? "Référence et nom requis" : undefined;

    return {
      reference,
      name,
      currentStock,
      pendingArrival,
      threshold,
      unit,
      location,
      valid,
      error,
    };
  }).filter((item) => item.reference || item.name);
}
