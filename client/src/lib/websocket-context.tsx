import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import type { SyncMessage } from "@shared/schema";

interface WebSocketContextType {
  isConnected: boolean;
  isOnline: boolean;
  sendMessage: (message: SyncMessage) => void;
  lastMessage: SyncMessage | null;
  pendingQueue: SyncMessage[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastMessage, setLastMessage] = useState<SyncMessage | null>(null);
  const [pendingQueue, setPendingQueue] = useState<SyncMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectingRef.current = false;
        setIsConnected(true);
        
        // Start ping interval to keep connection alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000); // Send ping every 25 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Ignore pong messages
          if (message.type === "pong") {
            return;
          }
          setLastMessage(message as SyncMessage);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        isConnectingRef.current = false;
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (navigator.onLine) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = () => {
        isConnectingRef.current = false;
        setIsConnected(false);
      };
    } catch (e) {
      console.error("WebSocket connection error:", e);
      isConnectingRef.current = false;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: SyncMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for later
      setPendingQueue((prev) => [...prev, message]);
    }
  }, []);

  // Process pending queue when connected
  useEffect(() => {
    if (isConnected && pendingQueue.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      pendingQueue.forEach((msg) => {
        wsRef.current?.send(JSON.stringify(msg));
      });
      setPendingQueue([]);
    }
  }, [isConnected, pendingQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      connect();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection
    connect();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, isOnline, sendMessage, lastMessage, pendingQueue }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
