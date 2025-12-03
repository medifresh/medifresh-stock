import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StockItem, Supplier } from "@shared/schema";
import { getMissingQuantity } from "@shared/schema";
import { Download, FileSpreadsheet, Building2, Package, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OrderListModalProps {
  items: StockItem[];
  open: boolean;
  onClose: () => void;
}

interface OrderItem extends StockItem {
  missing: number;
  supplier?: Supplier;
}

export function OrderListModal({ items, open, onClose }: OrderListModalProps) {
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const orderItems = useMemo((): OrderItem[] => {
    return items
      .filter((item) => {
        const missing = getMissingQuantity(item);
        return missing > 0;
      })
      .map((item) => ({
        ...item,
        missing: getMissingQuantity(item),
        supplier: suppliers.find((s) => s.id === item.supplierId),
      }))
      .sort((a, b) => b.missing - a.missing);
  }, [items, suppliers]);

  const totalMissing = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.missing, 0);
  }, [orderItems]);

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, OrderItem[]>();
    
    orderItems.forEach((item) => {
      const supplierName = item.supplier?.name || "Sans fournisseur";
      if (!groups.has(supplierName)) {
        groups.set(supplierName, []);
      }
      groups.get(supplierName)!.push(item);
    });

    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "Sans fournisseur") return 1;
      if (b[0] === "Sans fournisseur") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [orderItems]);

  const exportToCsv = () => {
    const headers = ["Référence", "Article", "Stock", "Seuil", "Arrivage", "Manquant", "Fournisseur", "Contact", "Téléphone", "Email"];
    const rows = orderItems.map((item) => [
      item.reference,
      item.name,
      item.currentStock.toString(),
      (item.threshold || 0).toString(),
      item.pendingArrival.toString(),
      item.missing.toString(),
      item.supplier?.name || "",
      item.supplier?.contact || "",
      item.supplier?.phone || "",
      item.supplier?.email || "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liste_commande_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = supplierGroups.map(([supplierName, items]) => {
      const supplierInfo = items[0]?.supplier;
      const header = `\n=== ${supplierName} ===`;
      const contact = supplierInfo?.contact ? `\nContact: ${supplierInfo.contact}` : "";
      const phone = supplierInfo?.phone ? `\nTél: ${supplierInfo.phone}` : "";
      const email = supplierInfo?.email ? `\nEmail: ${supplierInfo.email}` : "";
      
      const itemsList = items.map((item) => 
        `- ${item.reference} | ${item.name}: ${item.missing} unités`
      ).join("\n");

      return `${header}${contact}${phone}${email}\n${itemsList}`;
    }).join("\n");

    navigator.clipboard.writeText(`LISTE DE COMMANDE - ${new Date().toLocaleDateString("fr-FR")}\n${text}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-order-list-title">
            <ClipboardList className="h-5 w-5" />
            Liste de Commande
          </DialogTitle>
          <DialogDescription>
            Articles à commander pour atteindre les seuils définis
          </DialogDescription>
        </DialogHeader>

        {orderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium mb-1" data-testid="text-no-orders">Stock complet</h3>
            <p className="text-muted-foreground text-sm">
              Aucun article n'est en dessous du seuil défini
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Articles à commander</p>
                  <p className="text-2xl font-bold" data-testid="text-order-count">{orderItems.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Unités manquantes</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-total-missing">{totalMissing}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Fournisseurs concernés</p>
                  <p className="text-2xl font-bold" data-testid="text-supplier-count">{supplierGroups.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Sans fournisseur</p>
                  <p className="text-2xl font-bold text-amber-500" data-testid="text-no-supplier-count">
                    {orderItems.filter((i) => !i.supplier).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-6">
                {supplierGroups.map(([supplierName, groupItems]) => {
                  const supplierInfo = groupItems[0]?.supplier;
                  return (
                    <div key={supplierName} className="space-y-2">
                      <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold" data-testid={`text-supplier-group-${supplierName.replace(/\s/g, '-')}`}>{supplierName}</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {groupItems.length} article{groupItems.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {supplierInfo && (
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-4 mb-2 pl-6">
                          {supplierInfo.contact && <span>Contact: {supplierInfo.contact}</span>}
                          {supplierInfo.phone && <span>Tél: {supplierInfo.phone}</span>}
                          {supplierInfo.email && <span>Email: {supplierInfo.email}</span>}
                        </div>
                      )}
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-28">Référence</TableHead>
                              <TableHead>Article</TableHead>
                              <TableHead className="w-20 text-right">Stock</TableHead>
                              <TableHead className="w-20 text-right">Seuil</TableHead>
                              <TableHead className="w-20 text-right">Arrivage</TableHead>
                              <TableHead className="w-24 text-right">À commander</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupItems.map((item) => (
                              <TableRow key={item.id} data-testid={`row-order-${item.id}`}>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                  {item.reference}
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right tabular-nums">{item.currentStock}</TableCell>
                                <TableCell className="text-right tabular-nums">{item.threshold}</TableCell>
                                <TableCell className="text-right tabular-nums text-primary">
                                  {item.pendingArrival > 0 ? item.pendingArrival : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="destructive" className="font-mono" data-testid={`badge-missing-${item.id}`}>
                                    {item.missing}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
              <Button variant="outline" onClick={copyToClipboard} data-testid="button-copy-order">
                <ClipboardList className="h-4 w-4 mr-2" />
                Copier
              </Button>
              <Button onClick={exportToCsv} data-testid="button-export-order">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
