import { z } from "zod";

// Stock Item schema
export const stockItemSchema = z.object({
  id: z.string(),
  reference: z.string().min(1, "La référence est requise"),
  name: z.string().min(1, "Le nom est requis"),
  currentStock: z.number().min(0, "Le stock ne peut pas être négatif"),
  pendingArrival: z.number().min(0, "L'arrivage ne peut pas être négatif").default(0),
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

// Stock status helpers based on current stock level
export type StockStatus = "critical" | "low" | "adequate" | "high";

export function getStockStatus(item: StockItem): StockStatus {
  if (item.currentStock <= 0) return "critical";
  if (item.currentStock <= 10) return "low";
  if (item.currentStock <= 50) return "adequate";
  return "high";
}

export function getMissingQuantity(item: StockItem): number {
  return Math.max(0, -item.currentStock);
}

// Initial stock data for medical supplies
export const initialStockData: StockItem[] = [
  { id: "1", reference: "GL-100", name: "Gants latex (boîte 100)", currentStock: 45, pendingArrival: 20, unit: "boîtes", location: "Armoire A1", lastUpdated: new Date().toISOString() },
  { id: "2", reference: "MC-50", name: "Masques chirurgicaux (boîte 50)", currentStock: 120, pendingArrival: 0, unit: "boîtes", location: "Armoire A1", lastUpdated: new Date().toISOString() },
  { id: "3", reference: "SER-5ML", name: "Seringues 5ml", currentStock: 8, pendingArrival: 100, unit: "unités", location: "Armoire B2", lastUpdated: new Date().toISOString() },
  { id: "4", reference: "AIG-21G", name: "Aiguilles 21G", currentStock: 150, pendingArrival: 50, unit: "unités", location: "Armoire B2", lastUpdated: new Date().toISOString() },
  { id: "5", reference: "CPS-10", name: "Compresses stériles 10x10", currentStock: 300, pendingArrival: 0, unit: "unités", location: "Armoire C1", lastUpdated: new Date().toISOString() },
  { id: "6", reference: "SPA-5M", name: "Sparadrap 5m", currentStock: 25, pendingArrival: 10, unit: "rouleaux", location: "Armoire C1", lastUpdated: new Date().toISOString() },
  { id: "7", reference: "BET-500", name: "Désinfectant Bétadine 500ml", currentStock: 18, pendingArrival: 15, unit: "flacons", location: "Armoire D1", lastUpdated: new Date().toISOString() },
  { id: "8", reference: "ALC-1L", name: "Alcool 70° 1L", currentStock: 35, pendingArrival: 0, unit: "flacons", location: "Armoire D1", lastUpdated: new Date().toISOString() },
  { id: "9", reference: "THM-DIG", name: "Thermomètres digitaux", currentStock: 12, pendingArrival: 5, unit: "unités", location: "Tiroir E1", lastUpdated: new Date().toISOString() },
  { id: "10", reference: "TEN-01", name: "Tensiomètres", currentStock: 5, pendingArrival: 3, unit: "unités", location: "Tiroir E1", lastUpdated: new Date().toISOString() },
  { id: "11", reference: "PAR-500", name: "Paracétamol 500mg (boîte 20)", currentStock: 80, pendingArrival: 0, unit: "boîtes", location: "Pharmacie F1", lastUpdated: new Date().toISOString() },
  { id: "12", reference: "IBU-400", name: "Ibuprofène 400mg (boîte 20)", currentStock: 65, pendingArrival: 20, unit: "boîtes", location: "Pharmacie F1", lastUpdated: new Date().toISOString() },
  { id: "13", reference: "SER-PHY", name: "Sérum physiologique 500ml", currentStock: 200, pendingArrival: 0, unit: "poches", location: "Armoire G1", lastUpdated: new Date().toISOString() },
  { id: "14", reference: "CAT-20G", name: "Cathéters IV 20G", currentStock: 45, pendingArrival: 60, unit: "unités", location: "Armoire G1", lastUpdated: new Date().toISOString() },
  { id: "15", reference: "PAN-ADH", name: "Pansements adhésifs (boîte 100)", currentStock: 40, pendingArrival: 0, unit: "boîtes", location: "Armoire C1", lastUpdated: new Date().toISOString() },
];
