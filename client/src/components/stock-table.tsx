import { useState, useCallback, useMemo } from "react";
import type { StockItem, StockStatus } from "@shared/schema";
import { getStockStatus, getMissingQuantity } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Check, X, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Package, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleDetailModal } from "./article-detail-modal";

type SortField = "reference" | "name" | "currentStock" | "pendingArrival" | "threshold" | "status" | "missing";
type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface StockTableProps {
  items: StockItem[];
  onUpdateItem: (item: StockItem) => void;
  searchQuery: string;
  statusFilter: string;
}

const statusConfig: Record<StockStatus, { label: string; className: string; icon: typeof AlertTriangle }> = {
  critical: {
    label: "Critique",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertCircle,
  },
  low: {
    label: "Bas",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: AlertTriangle,
  },
  adequate: {
    label: "OK",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
  },
  high: {
    label: "Élevé",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: TrendingUp,
  },
};

function EditableCell({
  value,
  onSave,
  type = "text",
  className,
  align = "left",
}: {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    const newValue = type === "number" ? Number(editValue) : editValue;
    if (newValue !== value) {
      onSave(newValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", align === "right" && "justify-end")}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn("h-8", type === "number" ? "w-20 text-right" : "w-full", "font-mono")}
          autoFocus
          data-testid="input-edit-cell"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onClick={handleSave}
          data-testid="button-save-cell"
        >
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onClick={handleCancel}
          data-testid="button-cancel-cell"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "flex items-center gap-1.5 group cursor-pointer hover-elevate rounded px-2 py-1 -mx-2 -my-1 w-full",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
        className
      )}
      data-testid="button-edit-cell"
    >
      <span className={cn(type === "number" && "font-mono tabular-nums")}>{value}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

const statusPriority: Record<StockStatus, number> = {
  critical: 0,
  low: 1,
  adequate: 2,
  high: 3,
};

function SortableHeader({ 
  field, 
  label, 
  sortConfig, 
  onSort, 
  className 
}: { 
  field: SortField; 
  label: string; 
  sortConfig: SortConfig | null; 
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = sortConfig?.field === field;
  const Icon = isActive 
    ? (sortConfig.direction === "asc" ? ArrowUp : ArrowDown)
    : ArrowUpDown;
  
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 hover-elevate rounded px-1 -mx-1 py-0.5 -my-0.5 font-semibold",
        className
      )}
      data-testid={`button-sort-${field}`}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-40")} />
    </button>
  );
}

export function StockTable({ items, onUpdateItem, searchQuery, statusFilter }: StockTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        if (current.direction === "asc") {
          return { field, direction: "desc" };
        }
        return null; // Reset sorting
      }
      return { field, direction: "asc" };
    });
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase());

      const itemStatus = getStockStatus(item);
      const matchesStatus = statusFilter === "all" || itemStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        
        switch (sortConfig.field) {
          case "reference":
            comparison = a.reference.localeCompare(b.reference);
            break;
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "currentStock":
            comparison = a.currentStock - b.currentStock;
            break;
          case "pendingArrival":
            comparison = a.pendingArrival - b.pendingArrival;
            break;
          case "threshold":
            comparison = (a.threshold || 0) - (b.threshold || 0);
            break;
          case "status":
            comparison = statusPriority[getStockStatus(a)] - statusPriority[getStockStatus(b)];
            break;
          case "missing":
            comparison = getMissingQuantity(a) - getMissingQuantity(b);
            break;
        }
        
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [items, searchQuery, statusFilter, sortConfig]);

  const handleUpdateField = useCallback(
    (item: StockItem, field: keyof StockItem, value: string | number) => {
      const { lastUpdated, ...itemWithoutDate } = item;
      onUpdateItem({
        ...itemWithoutDate,
        [field]: value,
      } as StockItem);
    },
    [onUpdateItem]
  );

  if (filteredAndSortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1" data-testid="text-empty-state">Aucun résultat</h3>
        <p className="text-muted-foreground text-sm">
          Aucun article ne correspond à vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-28">
                  <SortableHeader field="reference" label="Référence" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <SortableHeader field="name" label="Article" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead className="w-20">
                  <SortableHeader field="currentStock" label="Stock" sortConfig={sortConfig} onSort={handleSort} className="justify-end" />
                </TableHead>
                <TableHead className="w-24">
                  <SortableHeader field="pendingArrival" label="Arrivage" sortConfig={sortConfig} onSort={handleSort} className="justify-end" />
                </TableHead>
                <TableHead className="w-20">
                  <SortableHeader field="threshold" label="Seuil" sortConfig={sortConfig} onSort={handleSort} className="justify-end" />
                </TableHead>
                <TableHead className="w-24">
                  <SortableHeader field="status" label="Statut" sortConfig={sortConfig} onSort={handleSort} className="justify-center" />
                </TableHead>
                <TableHead className="w-24">
                  <SortableHeader field="missing" label="Manquant" sortConfig={sortConfig} onSort={handleSort} className="justify-end" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.map((item) => {
              const status = getStockStatus(item);
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const missing = getMissingQuantity(item);

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "transition-colors",
                    status === "critical" && "bg-destructive/5",
                    status === "low" && "bg-amber-500/5"
                  )}
                  data-testid={`row-stock-${item.id}`}
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    <EditableCell
                      value={item.reference}
                      onSave={(val) => handleUpdateField(item, "reference", val)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-left hover:underline hover:text-primary cursor-pointer w-full"
                      data-testid={`button-article-detail-${item.id}`}
                    >
                      {item.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableCell
                      value={item.currentStock}
                      onSave={(val) => handleUpdateField(item, "currentStock", val)}
                      type="number"
                      align="right"
                      className={cn(
                        status === "critical" && "text-destructive font-semibold",
                        status === "low" && "text-amber-600 dark:text-amber-400 font-medium"
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.pendingArrival > 0 && (
                        <Package className="h-3.5 w-3.5 text-primary" />
                      )}
                      <EditableCell
                        value={item.pendingArrival}
                        onSave={(val) => handleUpdateField(item, "pendingArrival", val)}
                        type="number"
                        align="right"
                        className={item.pendingArrival > 0 ? "text-primary font-medium" : "text-muted-foreground"}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableCell
                      value={item.threshold || 0}
                      onSave={(val) => handleUpdateField(item, "threshold", val)}
                      type="number"
                      align="right"
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn("gap-1 border", config.className)}
                          data-testid={`badge-status-${item.id}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {status === "critical" && "Stock critique - Réapprovisionnement urgent"}
                        {status === "low" && "Stock bas - À réapprovisionner"}
                        {status === "adequate" && "Stock suffisant"}
                        {status === "high" && "Stock élevé"}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    {missing > 0 ? (
                      <span className="font-mono font-semibold text-destructive" data-testid={`text-missing-${item.id}`}>
                        {missing}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>

    <ArticleDetailModal
      item={selectedItem}
      open={selectedItem !== null}
      onClose={() => setSelectedItem(null)}
      onUpdateItem={(updatedItem) => {
        onUpdateItem(updatedItem);
        setSelectedItem(updatedItem);
      }}
    />
    </>
  );
}
