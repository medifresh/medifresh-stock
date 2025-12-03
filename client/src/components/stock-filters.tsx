import { useMemo, useRef } from "react";
import type { StockItem } from "@shared/schema";
import { getStockStatus, getMissingQuantity } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Printer, X, Upload, Download, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockFiltersProps {
  items: StockItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onOpenArrival: () => void;
  onOpenOrderList: () => void;
  onPrint: () => void;
  onImportCSV: (file: File) => void;
  onExportCSV: () => void;
}

export function StockFilters({
  items,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenArrival,
  onOpenOrderList,
  onPrint,
  onImportCSV,
  onExportCSV,
}: StockFiltersProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const critical = items.filter((i) => getStockStatus(i) === "critical").length;
    const low = items.filter((i) => getStockStatus(i) === "low").length;
    const pendingArrivals = items.filter((i) => i.pendingArrival > 0).length;
    const needsOrder = items.filter((i) => getMissingQuantity(i) > 0).length;
    return { critical, low, pendingArrivals, needsOrder };
  }, [items]);

  const hasActiveFilters = statusFilter !== "all" || searchQuery !== "";

  const clearFilters = () => {
    onSearchChange("");
    onStatusChange("all");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence ou nom..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10"
            data-testid="input-search"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px] h-10" data-testid="select-status">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="low">Bas</SelectItem>
              <SelectItem value="adequate">OK</SelectItem>
              <SelectItem value="high">Élevé</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-10 w-10"
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-import-csv"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 h-10"
            data-testid="button-import-csv"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={onExportCSV}
            className="gap-2 h-10"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={onOpenArrival} className="gap-2 h-10" data-testid="button-arrival">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Réception</span>
          </Button>
          <Button 
            variant={stats.needsOrder > 0 ? "default" : "outline"} 
            onClick={onOpenOrderList} 
            className={cn("gap-2 h-10", stats.needsOrder > 0 && "bg-destructive hover:bg-destructive/90")}
            data-testid="button-order-list"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Commande</span>
            {stats.needsOrder > 0 && (
              <Badge variant="secondary" className="ml-1 bg-background/20 text-current">
                {stats.needsOrder}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={onPrint} className="gap-2 h-10" data-testid="button-print">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      {(stats.critical > 0 || stats.low > 0 || stats.pendingArrivals > 0) && (
        <div className="flex gap-2 flex-wrap">
          {stats.critical > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 cursor-pointer border transition-colors",
                statusFilter === "critical"
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              )}
              onClick={() => onStatusChange(statusFilter === "critical" ? "all" : "critical")}
              data-testid="badge-critical-count"
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {stats.critical} critique{stats.critical > 1 ? "s" : ""}
            </Badge>
          )}
          {stats.low > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 cursor-pointer border transition-colors",
                statusFilter === "low"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
              )}
              onClick={() => onStatusChange(statusFilter === "low" ? "all" : "low")}
              data-testid="badge-low-count"
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {stats.low} bas
            </Badge>
          )}
          {stats.pendingArrivals > 0 && (
            <Badge
              variant="outline"
              className="gap-1.5 bg-primary/10 text-primary border-primary/30"
              data-testid="badge-pending-arrivals"
            >
              <Package className="h-3 w-3" />
              {stats.pendingArrivals} en attente
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
