import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StockItem, Supplier } from "@shared/schema";
import { getStockStatus, getMissingQuantity } from "@shared/schema";
import { Package, Building2, Phone, Mail, MapPin, Plus, X, Save, User, FileText, Pencil, Trash2 } from "lucide-react";

interface ArticleDetailModalProps {
  item: StockItem | null;
  open: boolean;
  onClose: () => void;
  onUpdateItem: (item: StockItem) => void;
}

export function ArticleDetailModal({ item, open, onClose, onUpdateItem }: ArticleDetailModalProps) {
  const { toast } = useToast();
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplier: typeof newSupplier) => {
      return apiRequest("POST", "/api/suppliers", supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setShowNewSupplier(false);
      setNewSupplier({ name: "", contact: "", phone: "", email: "", address: "", notes: "" });
      toast({ title: "Fournisseur ajouté", description: "Le fournisseur a été créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le fournisseur", variant: "destructive" });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (supplier: Supplier) => {
      return apiRequest("PUT", `/api/suppliers/${supplier.id}`, supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      toast({ title: "Fournisseur modifié", description: "Le fournisseur a été mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le fournisseur", variant: "destructive" });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      if (item && item.supplierId) {
        onUpdateItem({ ...item, supplierId: null });
      }
      toast({ title: "Fournisseur supprimé", description: "Le fournisseur a été supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le fournisseur", variant: "destructive" });
    },
  });

  const handleSupplierChange = (supplierId: string) => {
    if (item) {
      const newSupplierId = supplierId === "none" ? null : parseInt(supplierId, 10);
      onUpdateItem({ ...item, supplierId: newSupplierId });
    }
  };

  const handleCreateSupplier = () => {
    if (!newSupplier.name.trim()) {
      toast({ title: "Erreur", description: "Le nom du fournisseur est requis", variant: "destructive" });
      return;
    }
    createSupplierMutation.mutate(newSupplier);
  };

  const handleUpdateSupplier = () => {
    if (editingSupplier) {
      updateSupplierMutation.mutate(editingSupplier);
    }
  };

  if (!item) return null;

  const status = getStockStatus(item);
  const missing = getMissingQuantity(item);
  const currentSupplier = suppliers.find((s) => s.id === item.supplierId);

  const statusLabels: Record<string, { label: string; className: string }> = {
    critical: { label: "Critique", className: "bg-destructive text-destructive-foreground" },
    low: { label: "Bas", className: "bg-amber-500 text-white" },
    adequate: { label: "OK", className: "bg-emerald-500 text-white" },
    high: { label: "Élevé", className: "bg-blue-500 text-white" },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-article-detail-title">
            <Package className="h-5 w-5" />
            {item.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Référence: <span className="font-mono">{item.reference}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Informations Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stock actuel</Label>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-article-stock">{item.currentStock}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Arrivage prévu</Label>
                  <p className="text-xl font-bold tabular-nums text-primary" data-testid="text-article-arrival">{item.pendingArrival}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Seuil</Label>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-article-threshold">{item.threshold}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Statut</Label>
                  <Badge className={statusLabels[status].className} data-testid="badge-article-status">
                    {statusLabels[status].label}
                  </Badge>
                </div>
              </div>
              {missing > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-destructive font-medium" data-testid="text-article-missing">
                    Quantité manquante: <span className="font-bold">{missing}</span> unités à commander
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fournisseur
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewSupplier(!showNewSupplier)}
                  data-testid="button-add-supplier"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fournisseur assigné</Label>
                <Select
                  value={item.supplierId?.toString() || "none"}
                  onValueChange={handleSupplierChange}
                >
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun fournisseur</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentSupplier && !editingSupplier && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium" data-testid="text-supplier-name">{currentSupplier.name}</h4>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingSupplier(currentSupplier)}
                        data-testid="button-edit-supplier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSupplierMutation.mutate(currentSupplier.id)}
                        data-testid="button-delete-supplier"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {currentSupplier.contact && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span data-testid="text-supplier-contact">{currentSupplier.contact}</span>
                      </div>
                    )}
                    {currentSupplier.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span data-testid="text-supplier-phone">{currentSupplier.phone}</span>
                      </div>
                    )}
                    {currentSupplier.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span data-testid="text-supplier-email">{currentSupplier.email}</span>
                      </div>
                    )}
                    {currentSupplier.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span data-testid="text-supplier-address">{currentSupplier.address}</span>
                      </div>
                    )}
                    {currentSupplier.notes && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 mt-0.5" />
                        <span data-testid="text-supplier-notes">{currentSupplier.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingSupplier && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Modifier le fournisseur</h4>
                    <Button size="icon" variant="ghost" onClick={() => setEditingSupplier(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        value={editingSupplier.name}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                        data-testid="input-edit-supplier-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Contact</Label>
                        <Input
                          value={editingSupplier.contact || ""}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, contact: e.target.value })}
                          data-testid="input-edit-supplier-contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          value={editingSupplier.phone || ""}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                          data-testid="input-edit-supplier-phone"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editingSupplier.email || ""}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                        data-testid="input-edit-supplier-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input
                        value={editingSupplier.address || ""}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                        data-testid="input-edit-supplier-address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={editingSupplier.notes || ""}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                        rows={2}
                        data-testid="input-edit-supplier-notes"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateSupplier}
                    disabled={updateSupplierMutation.isPending}
                    data-testid="button-save-supplier"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              )}

              {showNewSupplier && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Nouveau fournisseur</h4>
                    <Button size="icon" variant="ghost" onClick={() => setShowNewSupplier(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        placeholder="Nom du fournisseur"
                        data-testid="input-new-supplier-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Contact</Label>
                        <Input
                          value={newSupplier.contact}
                          onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                          placeholder="Nom du contact"
                          data-testid="input-new-supplier-contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                          placeholder="01 23 45 67 89"
                          data-testid="input-new-supplier-phone"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        placeholder="email@example.com"
                        data-testid="input-new-supplier-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                        placeholder="Adresse complète"
                        data-testid="input-new-supplier-address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={newSupplier.notes}
                        onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                        placeholder="Notes additionnelles..."
                        rows={2}
                        data-testid="input-new-supplier-notes"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateSupplier}
                    disabled={createSupplierMutation.isPending}
                    data-testid="button-create-supplier"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le fournisseur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
