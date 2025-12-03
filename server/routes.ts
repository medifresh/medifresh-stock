import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertStockItemSchema, updateStockItemSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

const AUTH_CODE = "2025";

// Active session tokens (in production, use a proper session store)
const activeSessions = new Map<string, { createdAt: number }>();

// Clean up expired sessions (24 hours)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Track connected WebSocket clients
const clients = new Set<WebSocket>();

function broadcast(message: object, excludeClient?: WebSocket) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket server setup on /ws path
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WebSocket client connected. Total clients:", clients.size);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Broadcast to all other clients
        broadcast(message, ws);
      } catch (e) {
        console.error("Invalid WebSocket message:", e);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected. Total clients:", clients.size);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  // Authentication endpoint
  app.post("/api/auth", (req, res) => {
    const { code } = req.body;
    if (code === AUTH_CODE) {
      const token = randomUUID();
      activeSessions.set(token, { createdAt: Date.now() });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: "Code d'accès incorrect" });
    }
  });

  // Verify token endpoint
  app.post("/api/auth/verify", (req, res) => {
    const { token } = req.body;
    if (token && activeSessions.has(token)) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  });

  // Get all stock items
  app.get("/api/stock", async (_req, res) => {
    try {
      const items = await storage.getAllStock();
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du stock" });
    }
  });

  // Get single stock item
  app.get("/api/stock/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      const item = await storage.getStockById(id);
      if (!item) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching stock item:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'article" });
    }
  });

  // Create new stock item
  app.post("/api/stock", async (req, res) => {
    try {
      const validatedData = insertStockItemSchema.parse(req.body);
      const newItem = await storage.createStock(validatedData);
      
      // Broadcast to all clients
      broadcast({
        type: "stock_create",
        payload: newItem,
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Error creating stock:", error);
      res.status(500).json({ error: "Erreur lors de la création de l'article" });
    }
  });

  // Update stock item
  app.put("/api/stock/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      const updateData = { ...req.body, id };
      const validatedData = updateStockItemSchema.parse(updateData);
      const updatedItem = await storage.updateStock(validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      
      // Broadcast to all clients
      broadcast({
        type: "stock_update",
        payload: updatedItem,
        timestamp: new Date().toISOString(),
      });
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'article" });
    }
  });

  // Delete stock item
  app.delete("/api/stock/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      const deleted = await storage.deleteStock(id);
      if (!deleted) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      
      // Broadcast to all clients
      broadcast({
        type: "stock_delete",
        payload: { id },
        timestamp: new Date().toISOString(),
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'article" });
    }
  });

  // Apply stock arrivals (batch update) - receives items, adds to stock, reduces pending
  app.post("/api/stock/arrivals", async (req, res) => {
    try {
      const { arrivals } = req.body;
      if (!Array.isArray(arrivals) || arrivals.length === 0) {
        return res.status(400).json({ error: "Données de réception invalides" });
      }
      
      // Convert string IDs to numbers if needed
      const numericArrivals = arrivals.map((a: any) => ({
        itemId: typeof a.itemId === 'string' ? parseInt(a.itemId, 10) : a.itemId,
        quantity: a.quantity,
      }));
      
      const updatedItems = await storage.applyArrivals(numericArrivals);
      
      // Broadcast to all clients
      broadcast({
        type: "arrival",
        payload: updatedItems,
        timestamp: new Date().toISOString(),
      });
      
      res.json(updatedItems);
    } catch (error) {
      console.error("Error applying arrivals:", error);
      res.status(500).json({ error: "Erreur lors de l'application de la réception" });
    }
  });

  // Import stock from CSV
  app.post("/api/stock/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Données d'import invalides" });
      }
      
      const result = await storage.importStock(items);
      
      // Broadcast to all clients
      broadcast({
        type: "import",
        payload: result,
        timestamp: new Date().toISOString(),
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error importing stock:", error);
      res.status(500).json({ error: "Erreur lors de l'import du stock" });
    }
  });

  // Sync endpoint for offline data
  app.post("/api/sync", async (req, res) => {
    try {
      const { code, updates } = req.body;
      
      if (code !== AUTH_CODE) {
        return res.status(401).json({ error: "Code d'accès incorrect" });
      }
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Données de synchronisation invalides" });
      }
      
      const results = [];
      for (const update of updates) {
        if (update.type === "update" && update.item) {
          const result = await storage.updateStock(update.item);
          if (result) results.push(result);
        } else if (update.type === "create" && update.item) {
          const result = await storage.createStock(update.item);
          results.push(result);
        }
      }
      
      // Broadcast full sync to all clients
      broadcast({
        type: "full_sync",
        payload: await storage.getAllStock(),
        timestamp: new Date().toISOString(),
      });
      
      res.json({ success: true, updated: results.length });
    } catch (error) {
      console.error("Error syncing data:", error);
      res.status(500).json({ error: "Erreur lors de la synchronisation" });
    }
  });

  // Backup endpoint - download JSON dump
  app.get("/api/backup", async (_req, res) => {
    try {
      const backupData = await storage.getBackupData();
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=backup_medifresh_${new Date().toISOString().split("T")[0]}.json`
      );
      res.json(backupData);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: "Erreur lors de la création de la sauvegarde" });
    }
  });

  return httpServer;
}
