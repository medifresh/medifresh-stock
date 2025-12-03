import { eq } from "drizzle-orm";
import { db } from "./db";
import { stockItems, type StockItem, type InsertStockItem, type UpdateStockItem } from "@shared/schema";

export interface IStorage {
  getAllStock(): Promise<StockItem[]>;
  getStockById(id: number): Promise<StockItem | undefined>;
  createStock(item: InsertStockItem): Promise<StockItem>;
  updateStock(item: UpdateStockItem): Promise<StockItem | undefined>;
  deleteStock(id: number): Promise<boolean>;
  applyArrivals(arrivals: { itemId: number; quantity: number }[]): Promise<StockItem[]>;
  importStock(items: InsertStockItem[]): Promise<{ imported: number }>;
  getBackupData(): Promise<{ stock: StockItem[]; timestamp: string }>;
}

export class DatabaseStorage implements IStorage {
  async getAllStock(): Promise<StockItem[]> {
    return await db.select().from(stockItems).orderBy(stockItems.name);
  }

  async getStockById(id: number): Promise<StockItem | undefined> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return item;
  }

  async createStock(item: InsertStockItem): Promise<StockItem> {
    const [newItem] = await db.insert(stockItems).values({
      ...item,
      pendingArrival: item.pendingArrival || 0,
      threshold: item.threshold || 0,
      lastUpdated: new Date(),
    }).returning();
    return newItem;
  }

  async updateStock(item: UpdateStockItem): Promise<StockItem | undefined> {
    const [updatedItem] = await db
      .update(stockItems)
      .set({
        ...item,
        lastUpdated: new Date(),
      })
      .where(eq(stockItems.id, item.id))
      .returning();
    return updatedItem;
  }

  async deleteStock(id: number): Promise<boolean> {
    const result = await db.delete(stockItems).where(eq(stockItems.id, id)).returning();
    return result.length > 0;
  }

  async applyArrivals(arrivals: { itemId: number; quantity: number }[]): Promise<StockItem[]> {
    const updatedItems: StockItem[] = [];
    
    for (const arrival of arrivals) {
      const existing = await this.getStockById(arrival.itemId);
      if (existing) {
        const [updatedItem] = await db
          .update(stockItems)
          .set({
            currentStock: existing.currentStock + arrival.quantity,
            pendingArrival: Math.max(0, (existing.pendingArrival || 0) - arrival.quantity),
            lastUpdated: new Date(),
          })
          .where(eq(stockItems.id, arrival.itemId))
          .returning();
        updatedItems.push(updatedItem);
      }
    }
    
    return updatedItems;
  }

  async importStock(items: InsertStockItem[]): Promise<{ imported: number }> {
    let imported = 0;
    
    for (const item of items) {
      // Check if reference already exists
      const allItems = await db.select().from(stockItems);
      const existingByRef = allItems.find(
        (s) => s.reference.toLowerCase() === item.reference.toLowerCase()
      );
      
      if (existingByRef) {
        // Update existing item
        await db
          .update(stockItems)
          .set({
            name: item.name,
            currentStock: item.currentStock,
            pendingArrival: item.pendingArrival || 0,
            threshold: item.threshold || 0,
            unit: item.unit,
            location: item.location,
            lastUpdated: new Date(),
          })
          .where(eq(stockItems.id, existingByRef.id));
      } else {
        // Create new item
        await db.insert(stockItems).values({
          ...item,
          pendingArrival: item.pendingArrival || 0,
          threshold: item.threshold || 0,
          lastUpdated: new Date(),
        });
      }
      imported++;
    }
    
    return { imported };
  }

  async getBackupData(): Promise<{ stock: StockItem[]; timestamp: string }> {
    return {
      stock: await this.getAllStock(),
      timestamp: new Date().toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();
