import { useMemo } from "react";
import type { StockItem } from "@shared/schema";
import { getStockStatus } from "@shared/schema";
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
import { Search, Package, Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockFiltersProps {
  items: StockItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onOpenArrival: () => void;
  onPrint: () => void;
}

export function StockFilters({
  items,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onOpenArrival,
  onPrint,
}: StockFiltersProps) {
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return Array.from(cats).sort();
  }, [items]);

  const stats = useMemo(() => {
    const critical = items.filter((i) => getStockStatus(i) === "critical").length;
    const low = items.filter((i) => getStockStatus(i) === "low").length;
    return { critical, low };
  }, [items]);

  const hasActiveFilters = categoryFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onStatusChange("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, catégorie ou emplacement..."
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
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[160px] h-10" data-testid="select-category">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        <div className="flex gap-2">
          <Button onClick={onOpenArrival} className="gap-2 h-10" data-testid="button-arrival">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Arrivage</span>
          </Button>
          <Button variant="outline" onClick={onPrint} className="gap-2 h-10" data-testid="button-print">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      {(stats.critical > 0 || stats.low > 0) && (
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
        </div>
      )}
    </div>
  );
}
