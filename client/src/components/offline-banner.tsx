import { useWebSocket } from "@/lib/websocket-context";
import { WifiOff, CloudOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const { isOnline, isConnected, pendingQueue } = useWebSocket();

  if (isOnline && isConnected) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] transition-transform duration-300",
        "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
        !isOnline
          ? "bg-destructive text-destructive-foreground"
          : "bg-amber-500 text-white"
      )}
      data-testid="banner-offline"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Mode hors ligne</span>
          {pendingQueue.length > 0 && (
            <span className="opacity-90">
              - {pendingQueue.length} modification{pendingQueue.length > 1 ? "s" : ""} en attente
            </span>
          )}
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Reconnexion au serveur...</span>
        </>
      )}
    </div>
  );
}
