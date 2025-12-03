import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Stock Items table
export const stockItems = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull(),
  name: text("name").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  pendingArrival: integer("pending_arrival").notNull().default(0),
  threshold: integer("threshold").notNull().default(0),
  unit: text("unit").notNull().default("unités"),
  location: text("location"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Types
export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

// Zod schemas
export const insertStockItemSchema = createInsertSchema(stockItems).omit({ 
  id: true, 
  lastUpdated: true 
});

export const updateStockItemSchema = createInsertSchema(stockItems).partial().extend({
  id: z.number(),
});

export type UpdateStockItem = z.infer<typeof updateStockItemSchema>;

// Stock Arrival schema for batch updates
export const stockArrivalSchema = z.object({
  itemId: z.number(),
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
