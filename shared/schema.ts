import { z } from "zod";

// Stock Item schema
export const stockItemSchema = z.object({
  id: z.string(),
  reference: z.string().min(1, "La référence est requise"),
  name: z.string().min(1, "Le nom est requis"),
  currentStock: z.number().min(0, "Le stock ne peut pas être négatif"),
  pendingArrival: z.number().min(0, "L'arrivage ne peut pas être négatif").default(0),
  threshold: z.number().min(0, "Le seuil ne peut pas être négatif").default(0),
  unit: z.string().default("unités"),
  location: z.string().optional(),
  lastUpdated: z.string(),
});

export type StockItem = z.infer<typeof stockItemSchema>;

export const insertStockItemSchema = stockItemSchema.omit({ id: true, lastUpdated: true });
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;

export const updateStockItemSchema = stockItemSchema.partial().required({ id: true });
export type UpdateStockItem = z.infer<typeof updateStockItemSchema>;

// Stock Arrival schema for batch updates
export const stockArrivalSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1, "La quantité doit être positive"),
  notes: z.string().optional(),
});

export type StockArrival = z.infer<typeof stockArrivalSchema>;

export const batchArrivalSchema = z.object({
  arrivals: z.array(stockArrivalSchema).min(1, "Au moins un article requis"),
  date: z.string(),
});

export type BatchArrival = z.infer<typeof batchArrivalSchema>;

// Auth schema
export const authSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
});

export type AuthRequest = z.infer<typeof authSchema>;

// Sync message types for WebSocket
export const syncMessageSchema = z.object({
  type: z.enum(["stock_update", "stock_create", "stock_delete", "full_sync", "arrival", "import"]),
  payload: z.any(),
  timestamp: z.string(),
});

export type SyncMessage = z.infer<typeof syncMessageSchema>;

// Stock status helpers based on current stock level vs threshold
export type StockStatus = "critical" | "low" | "adequate" | "high";

export function getStockStatus(item: StockItem): StockStatus {
  const available = item.currentStock + (item.pendingArrival || 0);
  const threshold = item.threshold || 0;
  
  if (available <= 0) return "critical";
  if (available < threshold) return "low";
  if (available <= threshold * 1.5) return "adequate";
  return "high";
}

// Calculate missing quantity: Seuil - (Stock + Arrivage)
export function getMissingQuantity(item: StockItem): number {
  const available = item.currentStock + (item.pendingArrival || 0);
  const threshold = item.threshold || 0;
  return Math.max(0, threshold - available);
}

// Initial stock data (empty - use CSV import to add articles)
export const initialStockData: StockItem[] = [];
