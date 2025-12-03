import { useState, useCallback, useMemo } from "react";
import type { StockItem, StockStatus } from "@shared/schema";
import { getStockStatus, getMissingQuantity } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Check, X, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockTableProps {
  items: StockItem[];
  onUpdateItem: (item: StockItem) => void;
  searchQuery: string;
  categoryFilter: string;
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
}: {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
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
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8 w-20 text-right font-mono"
          autoFocus
          data-testid="input-edit-cell"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          data-testid="button-save-cell"
        >
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
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
        "flex items-center gap-1.5 group cursor-pointer hover-elevate rounded px-2 py-1 -mx-2 -my-1",
        className
      )}
      data-testid="button-edit-cell"
    >
      <span className={cn(type === "number" && "font-mono tabular-nums")}>{value}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

export function StockTable({ items, onUpdateItem, searchQuery, categoryFilter, statusFilter }: StockTableProps) {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      
      const itemStatus = getStockStatus(item);
      const matchesStatus = statusFilter === "all" || itemStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const handleUpdateField = useCallback(
    (item: StockItem, field: keyof StockItem, value: string | number) => {
      onUpdateItem({
        ...item,
        [field]: value,
        lastUpdated: new Date().toISOString(),
      });
    },
    [onUpdateItem]
  );

  if (filteredItems.length === 0) {
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
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold min-w-[200px]">Article</TableHead>
              <TableHead className="font-semibold">Catégorie</TableHead>
              <TableHead className="font-semibold text-right w-24">Stock</TableHead>
              <TableHead className="font-semibold text-right w-24">Min</TableHead>
              <TableHead className="font-semibold text-right w-24">Max</TableHead>
              <TableHead className="font-semibold text-right w-24">Manquant</TableHead>
              <TableHead className="font-semibold w-28">Statut</TableHead>
              <TableHead className="font-semibold">Emplacement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              const missing = getMissingQuantity(item);
              const config = statusConfig[status];
              const StatusIcon = config.icon;

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
                  <TableCell className="font-medium">
                    <EditableCell
                      value={item.name}
                      onSave={(val) => handleUpdateField(item, "name", val)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableCell
                      value={item.currentStock}
                      onSave={(val) => handleUpdateField(item, "currentStock", val)}
                      type="number"
                      className={cn(
                        "justify-end",
                        status === "critical" && "text-destructive font-semibold",
                        status === "low" && "text-amber-600 dark:text-amber-400 font-medium"
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <EditableCell
                      value={item.minStock}
                      onSave={(val) => handleUpdateField(item, "minStock", val)}
                      type="number"
                      className="justify-end"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <EditableCell
                      value={item.maxStock}
                      onSave={(val) => handleUpdateField(item, "maxStock", val)}
                      type="number"
                      className="justify-end"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {missing > 0 ? (
                      <span className="font-mono tabular-nums text-destructive font-medium" data-testid={`text-missing-${item.id}`}>
                        -{missing}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="text-muted-foreground">
                    {item.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
