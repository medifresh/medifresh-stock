import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { StockItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket-context";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { StockFilters } from "@/components/stock-filters";
import { StockTable } from "@/components/stock-table";
import { StockArrivalModal } from "@/components/stock-arrival-modal";
import { CSVImportModal, parseCSV } from "@/components/csv-import-modal";
import { OfflineBanner } from "@/components/offline-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedItem {
  reference: string;
  name: string;
  currentStock: number;
  pendingArrival: number;
  unit: string;
  location: string;
  valid: boolean;
  error?: string;
}

export default function StockManager() {
  const { toast } = useToast();
  const { sendMessage, lastMessage } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  const {
    data: stockItems = [],
    isLoading,
    refetch,
  } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const updateMutation = useMutation({
    mutationFn: async (item: StockItem) => {
      const response = await apiRequest("PUT", `/api/stock/${item.id}`, item);
      return response.json();
    },
    onSuccess: (updatedItem: StockItem) => {
      queryClient.setQueryData<StockItem[]>(["/api/stock"], (old) =>
        old?.map((item) => (item.id === updatedItem.id ? updatedItem : item)) ?? []
      );
      
      sendMessage({
        type: "stock_update",
        payload: updatedItem,
        timestamp: new Date().toISOString(),
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'article",
        variant: "destructive",
      });
    },
  });

  const arrivalMutation = useMutation({
    mutationFn: async (arrivals: { itemId: string; quantity: number }[]) => {
      const response = await apiRequest("POST", "/api/stock/arrivals", { arrivals });
      return response.json();
    },
    onSuccess: (updatedItems: StockItem[]) => {
      queryClient.setQueryData<StockItem[]>(["/api/stock"], (old) => {
        if (!old) return updatedItems;
        const updateMap = new Map(updatedItems.map((item) => [item.id, item]));
        return old.map((item) => updateMap.get(item.id) ?? item);
      });
      
      sendMessage({
        type: "arrival",
        payload: updatedItems,
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Réception enregistrée",
        description: `${updatedItems.length} article${updatedItems.length > 1 ? "s" : ""} mis à jour`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la réception",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: ParsedItem[]) => {
      const response = await apiRequest("POST", "/api/stock/import", { items: items.filter(i => i.valid) });
      return response.json();
    },
    onSuccess: (result: { imported: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      
      sendMessage({
        type: "import",
        payload: {},
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Import réussi",
        description: `${result.imported} article${result.imported > 1 ? "s" : ""} importé${result.imported > 1 ? "s" : ""}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'importer les articles",
        variant: "destructive",
      });
    },
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "stock_update") {
      const updatedItem = lastMessage.payload as StockItem;
      queryClient.setQueryData<StockItem[]>(["/api/stock"], (old) =>
        old?.map((item) => (item.id === updatedItem.id ? updatedItem : item)) ?? []
      );
    } else if (lastMessage.type === "full_sync" || lastMessage.type === "arrival" || lastMessage.type === "import") {
      refetch();
    }
  }, [lastMessage, refetch]);

  const handleUpdateItem = useCallback(
    (item: StockItem) => {
      updateMutation.mutate(item);
    },
    [updateMutation]
  );

  const handleApplyArrivals = useCallback(
    (arrivals: { itemId: string; quantity: number }[]) => {
      arrivalMutation.mutate(arrivals);
    },
    [arrivalMutation]
  );

  const handleImportCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setParsedItems(parsed);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
  }, []);

  const handleConfirmImport = useCallback(() => {
    importMutation.mutate(parsedItems);
  }, [importMutation, parsedItems]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Référence", "Article", "Stock", "Arrivage", "Seuil"];
    const rows = stockItems.map((item) => [
      item.reference,
      item.name,
      item.currentStock,
      item.pendingArrival,
      item.threshold || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `stock_medifresh_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: "Le fichier CSV a été téléchargé",
    });
  }, [stockItems, toast]);

  const handleBackup = useCallback(async () => {
    try {
      const response = await fetch("/api/backup");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_medifresh_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sauvegarde réussie",
        description: "Le fichier de sauvegarde a été téléchargé",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const stats = useMemo(() => {
    const critical = stockItems.filter((i) => i.currentStock <= 0).length;
    const low = stockItems.filter((i) => i.currentStock > 0 && i.currentStock <= 10).length;
    const total = stockItems.length;
    const totalPending = stockItems.reduce((acc, i) => acc + (i.pendingArrival || 0), 0);
    return { critical, low, total, totalPending };
  }, [stockItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b border-border bg-background flex items-center px-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="ml-3 space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <main className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[400px] rounded-lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <OfflineBanner />
      <Header onExportCSV={handleExportCSV} onBackup={handleBackup} />

      <main className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <StatCard
            title="Total articles"
            value={stats.total}
            icon={Package}
            className="text-primary"
          />
          <StatCard
            title="En attente"
            value={stats.totalPending}
            icon={TrendingUp}
            className="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Stock critique"
            value={stats.critical}
            icon={AlertTriangle}
            className="text-destructive"
            highlight={stats.critical > 0}
          />
          <StatCard
            title="Stock bas"
            value={stats.low}
            icon={BarChart3}
            className="text-amber-600 dark:text-amber-400"
            highlight={stats.low > 0}
          />
        </div>

        <div className="print:hidden">
          <StockFilters
            items={stockItems}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onOpenArrival={() => setIsArrivalModalOpen(true)}
            onPrint={handlePrint}
            onImportCSV={handleImportCSV}
            onExportCSV={handleExportCSV}
          />
        </div>

        <div className="print:block">
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold">Medifresh Stock - État du stock</h1>
            <p className="text-sm text-gray-500">
              Généré le {new Date().toLocaleDateString("fr-FR")} à{" "}
              {new Date().toLocaleTimeString("fr-FR")}
            </p>
          </div>
          <StockTable
            items={stockItems}
            onUpdateItem={handleUpdateItem}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </div>
      </main>

      <StockArrivalModal
        open={isArrivalModalOpen}
        onOpenChange={setIsArrivalModalOpen}
        items={stockItems}
        onApplyArrivals={handleApplyArrivals}
      />

      <CSVImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        parsedItems={parsedItems}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: typeof Package;
  className?: string;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, className, highlight }: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-4 border-card-border transition-colors",
        highlight && "border-destructive/30 bg-destructive/5"
      )}
      data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-semibold mt-1 tabular-nums", className)}>
            {value}
          </p>
        </div>
        <div className={cn("p-2 rounded-lg bg-current/10", className)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
