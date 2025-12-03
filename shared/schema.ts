import { z } from "zod";

// Stock Item schema
export const stockItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  currentStock: z.number().min(0, "Le stock ne peut pas être négatif"),
  minStock: z.number().min(0, "Le stock minimum ne peut pas être négatif"),
  maxStock: z.number().min(0, "Le stock maximum ne peut pas être négatif"),
  unit: z.string().default("unités"),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
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
  type: z.enum(["stock_update", "stock_create", "stock_delete", "full_sync", "arrival"]),
  payload: z.any(),
  timestamp: z.string(),
});

export type SyncMessage = z.infer<typeof syncMessageSchema>;

// Stock status helpers
export type StockStatus = "critical" | "low" | "adequate" | "high";

export function getStockStatus(item: StockItem): StockStatus {
  const ratio = item.currentStock / item.minStock;
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.75) return "low";
  if (item.currentStock <= item.maxStock) return "adequate";
  return "high";
}

export function getMissingQuantity(item: StockItem): number {
  return Math.max(0, item.minStock - item.currentStock);
}

// Initial stock data for medical supplies
export const initialStockData: StockItem[] = [
  { id: "1", name: "Gants latex (boîte 100)", category: "Protection", currentStock: 45, minStock: 50, maxStock: 200, unit: "boîtes", location: "Armoire A1", lastUpdated: new Date().toISOString() },
  { id: "2", name: "Masques chirurgicaux (boîte 50)", category: "Protection", currentStock: 120, minStock: 100, maxStock: 500, unit: "boîtes", location: "Armoire A1", lastUpdated: new Date().toISOString() },
  { id: "3", name: "Seringues 5ml", category: "Injection", currentStock: 8, minStock: 100, maxStock: 500, unit: "unités", location: "Armoire B2", lastUpdated: new Date().toISOString() },
  { id: "4", name: "Aiguilles 21G", category: "Injection", currentStock: 150, minStock: 200, maxStock: 800, unit: "unités", location: "Armoire B2", lastUpdated: new Date().toISOString() },
  { id: "5", name: "Compresses stériles 10x10", category: "Pansement", currentStock: 300, minStock: 200, maxStock: 1000, unit: "unités", location: "Armoire C1", lastUpdated: new Date().toISOString() },
  { id: "6", name: "Sparadrap 5m", category: "Pansement", currentStock: 25, minStock: 30, maxStock: 100, unit: "rouleaux", location: "Armoire C1", lastUpdated: new Date().toISOString() },
  { id: "7", name: "Désinfectant Bétadine 500ml", category: "Antiseptique", currentStock: 18, minStock: 20, maxStock: 80, unit: "flacons", location: "Armoire D1", lastUpdated: new Date().toISOString() },
  { id: "8", name: "Alcool 70° 1L", category: "Antiseptique", currentStock: 35, minStock: 25, maxStock: 100, unit: "flacons", location: "Armoire D1", lastUpdated: new Date().toISOString() },
  { id: "9", name: "Thermomètres digitaux", category: "Diagnostic", currentStock: 12, minStock: 15, maxStock: 50, unit: "unités", location: "Tiroir E1", lastUpdated: new Date().toISOString() },
  { id: "10", name: "Tensiomètres", category: "Diagnostic", currentStock: 5, minStock: 8, maxStock: 20, unit: "unités", location: "Tiroir E1", lastUpdated: new Date().toISOString() },
  { id: "11", name: "Paracétamol 500mg (boîte 20)", category: "Médicament", currentStock: 80, minStock: 100, maxStock: 300, unit: "boîtes", location: "Pharmacie F1", lastUpdated: new Date().toISOString() },
  { id: "12", name: "Ibuprofène 400mg (boîte 20)", category: "Médicament", currentStock: 65, minStock: 80, maxStock: 250, unit: "boîtes", location: "Pharmacie F1", lastUpdated: new Date().toISOString() },
  { id: "13", name: "Sérum physiologique 500ml", category: "Perfusion", currentStock: 200, minStock: 150, maxStock: 500, unit: "poches", location: "Armoire G1", lastUpdated: new Date().toISOString() },
  { id: "14", name: "Cathéters IV 20G", category: "Perfusion", currentStock: 45, minStock: 100, maxStock: 400, unit: "unités", location: "Armoire G1", lastUpdated: new Date().toISOString() },
  { id: "15", name: "Pansements adhésifs (boîte 100)", category: "Pansement", currentStock: 40, minStock: 50, maxStock: 150, unit: "boîtes", location: "Armoire C1", lastUpdated: new Date().toISOString() },
];
