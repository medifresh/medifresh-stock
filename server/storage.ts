import type { StockItem, InsertStockItem, UpdateStockItem } from "@shared/schema";
import { initialStockData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAllStock(): Promise<StockItem[]>;
  getStockById(id: string): Promise<StockItem | undefined>;
  createStock(item: InsertStockItem): Promise<StockItem>;
  updateStock(item: UpdateStockItem): Promise<StockItem | undefined>;
  deleteStock(id: string): Promise<boolean>;
  applyArrivals(arrivals: { itemId: string; quantity: number }[]): Promise<StockItem[]>;
  importStock(items: InsertStockItem[]): Promise<{ imported: number }>;
  getBackupData(): Promise<{ stock: StockItem[]; timestamp: string }>;
}

export class MemStorage implements IStorage {
  private stock: Map<string, StockItem>;

  constructor() {
    this.stock = new Map();
    // Initialize with sample medical stock data
    initialStockData.forEach((item) => {
      this.stock.set(item.id, item);
    });
  }

  async getAllStock(): Promise<StockItem[]> {
    return Array.from(this.stock.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  async getStockById(id: string): Promise<StockItem | undefined> {
    return this.stock.get(id);
  }

  async createStock(item: InsertStockItem): Promise<StockItem> {
    const id = randomUUID();
    const newItem: StockItem = {
      ...item,
      id,
      pendingArrival: item.pendingArrival || 0,
      threshold: item.threshold || 0,
      lastUpdated: new Date().toISOString(),
    };
    this.stock.set(id, newItem);
    return newItem;
  }

  async updateStock(item: UpdateStockItem): Promise<StockItem | undefined> {
    const existing = this.stock.get(item.id);
    if (!existing) {
      return undefined;
    }
    const updatedItem: StockItem = {
      ...existing,
      ...item,
      lastUpdated: new Date().toISOString(),
    };
    this.stock.set(item.id, updatedItem);
    return updatedItem;
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stock.delete(id);
  }

  async applyArrivals(arrivals: { itemId: string; quantity: number }[]): Promise<StockItem[]> {
    const updatedItems: StockItem[] = [];
    
    for (const arrival of arrivals) {
      const existing = this.stock.get(arrival.itemId);
      if (existing) {
        const updatedItem: StockItem = {
          ...existing,
          currentStock: existing.currentStock + arrival.quantity,
          pendingArrival: Math.max(0, (existing.pendingArrival || 0) - arrival.quantity),
          lastUpdated: new Date().toISOString(),
        };
        this.stock.set(arrival.itemId, updatedItem);
        updatedItems.push(updatedItem);
      }
    }
    
    return updatedItems;
  }

  async importStock(items: InsertStockItem[]): Promise<{ imported: number }> {
    let imported = 0;
    
    for (const item of items) {
      // Check if reference already exists
      const existingByRef = Array.from(this.stock.values()).find(
        (s) => s.reference.toLowerCase() === item.reference.toLowerCase()
      );
      
      if (existingByRef) {
        // Update existing item
        const updatedItem: StockItem = {
          ...existingByRef,
          name: item.name,
          currentStock: item.currentStock,
          pendingArrival: item.pendingArrival || 0,
          threshold: item.threshold || 0,
          unit: item.unit,
          location: item.location,
          lastUpdated: new Date().toISOString(),
        };
        this.stock.set(existingByRef.id, updatedItem);
      } else {
        // Create new item
        const id = randomUUID();
        const newItem: StockItem = {
          ...item,
          id,
          pendingArrival: item.pendingArrival || 0,
          threshold: item.threshold || 0,
          lastUpdated: new Date().toISOString(),
        };
        this.stock.set(id, newItem);
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

export const storage = new MemStorage();
