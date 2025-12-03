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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Minus, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockArrivalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StockItem[];
  onApplyArrivals: (arrivals: { itemId: string; quantity: number }[]) => void;
}

export function StockArrivalModal({
  open,
  onOpenChange,
  items,
  onApplyArrivals,
}: StockArrivalModalProps) {
  const [arrivals, setArrivals] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const totalItems = useMemo(() => {
    return Object.values(arrivals).filter((qty) => qty > 0).length;
  }, [arrivals]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setArrivals((prev) => {
      const current = prev[itemId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newValue };
    });
  };

  const handleInputChange = (itemId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      const { [itemId]: _, ...rest } = arrivals;
      setArrivals(rest);
    } else {
      setArrivals((prev) => ({ ...prev, [itemId]: numValue }));
    }
  };

  const handleApply = () => {
    const arrivalsList = Object.entries(arrivals)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));
    
    if (arrivalsList.length > 0) {
      onApplyArrivals(arrivalsList);
      setArrivals({});
      setSearchQuery("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setArrivals({});
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            Enregistrer une réception
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les articles reçus et indiquez les quantités (déduit de l'arrivage en attente)
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
            data-testid="input-arrival-search"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const quantity = arrivals[item.id] || 0;
              const hasQuantity = quantity > 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    hasQuantity
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  data-testid={`arrival-item-${item.id}`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.reference}</span>
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Stock: {item.currentStock} {item.unit}
                      </span>
                      {item.pendingArrival > 0 && (
                        <Badge variant="outline" className="text-xs font-normal gap-1 bg-primary/10 text-primary border-primary/30">
                          <Package className="h-3 w-3" />
                          {item.pendingArrival} en attente
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={quantity === 0}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={quantity || ""}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 text-center font-mono"
                      data-testid={`input-quantity-${item.id}`}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Aucun article trouvé
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 mt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {totalItems > 0 && (
              <span>{totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}</span>
            )}
          </div>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-arrival">
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={totalItems === 0}
            className="gap-2"
            data-testid="button-apply-arrival"
          >
            <Check className="h-4 w-4" />
            Valider la réception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
