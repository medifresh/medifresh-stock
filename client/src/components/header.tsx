import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/lib/websocket-context";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Moon,
  Sun,
  LogOut,
  Download,
  Menu,
  Cloud,
  CloudOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onExportCSV: () => void;
  onBackup: () => void;
}

export function Header({ onExportCSV, onBackup }: HeaderProps) {
  const { logout } = useAuth();
  const { isConnected, isOnline, pendingQueue } = useWebSocket();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold leading-none" data-testid="text-app-title">
              Medifresh Stock
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestion de stock médical
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm",
                  isOnline && isConnected
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : isOnline
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-destructive/10 text-destructive"
                )}
                data-testid="status-connection"
              >
                {isOnline && isConnected ? (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span className="hidden md:inline">Connecté</span>
                  </>
                ) : isOnline ? (
                  <>
                    <CloudOff className="w-4 h-4" />
                    <span className="hidden md:inline">Reconnexion...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="hidden md:inline">Hors ligne</span>
                  </>
                )}
                {pendingQueue.length > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {pendingQueue.length}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isOnline && isConnected
                ? "Synchronisé en temps réel"
                : isOnline
                ? "Reconnexion au serveur..."
                : `Hors ligne - ${pendingQueue.length} modification(s) en attente`}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onExportCSV} data-testid="menu-export-csv">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBackup} data-testid="menu-backup">
                <Cloud className="h-4 w-4 mr-2" />
                Sauvegarder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
