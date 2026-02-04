/**
 * IPC hook for Beads Canvas communication with controller.
 * Specialized for bead selection, detail requests, and tree refresh.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "ink";
import { connectWithRetry, type IPCClient } from "../../../ipc/client";
import type { CanvasMessage, ControllerMessage } from "../../../ipc/types";
import type { BeadsConfig } from "../types";

export interface UseBeadsIPCOptions {
  /** IPC socket path */
  socketPath: string | undefined;
  /** Scenario name for ready message */
  scenario: string;
  /** Called when controller sends close */
  onClose?: () => void;
  /** Called when controller sends config update */
  onUpdate?: (config: BeadsConfig) => void;
  /** Called when controller requests showing bead details */
  onShowDetails?: (beadId: string) => void;
}

export interface BeadsIPCHandle {
  /** Whether connected to controller */
  isConnected: boolean;
  /** Connection error message if connection failed */
  connectionError: string | null;
  /** Send bead selection change */
  sendBeadSelected: (beadId: string) => void;
  /** Request bead details from controller */
  sendRequestDetails: (beadId: string) => void;
  /** Request bead blockers from controller */
  sendRequestBlockers: (beadId: string) => void;
  /** Request tree refresh */
  sendBeadRefresh: () => void;
  /** Navigate between epics */
  sendEpicNav: (direction: "prev" | "next") => void;
  /** Send error message */
  sendError: (message: string) => void;
}

export function useBeadsIPC(options: UseBeadsIPCOptions): BeadsIPCHandle {
  const { socketPath, scenario, onClose, onUpdate, onShowDetails } = options;
  const { exit } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const clientRef = useRef<IPCClient | null>(null);

  // Keep callback refs to avoid effect re-runs
  const onCloseRef = useRef(onClose);
  const onUpdateRef = useRef(onUpdate);
  const onShowDetailsRef = useRef(onShowDetails);

  useEffect(() => {
    onCloseRef.current = onClose;
    onUpdateRef.current = onUpdate;
    onShowDetailsRef.current = onShowDetails;
  }, [onClose, onUpdate, onShowDetails]);

  // Connect to controller on mount
  useEffect(() => {
    if (!socketPath) return;

    let mounted = true;

    const connect = async () => {
      try {
        const client = await connectWithRetry({
          socketPath,
          onMessage: (msg: ControllerMessage) => {
            switch (msg.type) {
              case "close":
                onCloseRef.current?.();
                exit();
                break;
              case "update":
                onUpdateRef.current?.(msg.config as BeadsConfig);
                break;
              case "ping":
                client.send({ type: "pong" });
                break;
              case "showDetails":
                onShowDetailsRef.current?.(msg.beadId);
                break;
            }
          },
          onDisconnect: () => {
            if (mounted) {
              setIsConnected(false);
              setConnectionError("IPC connection lost");
            }
          },
          onError: (err) => {
            console.error("Beads IPC error:", err);
            if (mounted) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              setConnectionError(`IPC error: ${errorMessage}`);
            }
          },
        });

        if (mounted) {
          clientRef.current = client;
          setIsConnected(true);
          setConnectionError(null);
          // Send ready message automatically
          client.send({ type: "ready", scenario });
        } else {
          client.close();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Failed to connect to controller:", err);
        if (mounted) {
          setConnectionError(`IPC connection failed: ${errorMessage}`);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      clientRef.current?.close();
      clientRef.current = null;
    };
  }, [socketPath, scenario, exit]);

  const sendBeadSelected = useCallback((beadId: string) => {
    clientRef.current?.send({ type: "beadSelected", beadId });
  }, []);

  const sendRequestDetails = useCallback((beadId: string) => {
    clientRef.current?.send({ type: "requestDetails", beadId });
  }, []);

  const sendRequestBlockers = useCallback((beadId: string) => {
    clientRef.current?.send({ type: "requestBlockers", beadId });
  }, []);

  const sendBeadRefresh = useCallback(() => {
    clientRef.current?.send({ type: "beadRefresh" });
  }, []);

  const sendEpicNav = useCallback((direction: "prev" | "next") => {
    clientRef.current?.send({ type: "epicNav", direction });
  }, []);

  const sendError = useCallback((message: string) => {
    clientRef.current?.send({ type: "error", message });
  }, []);

  return {
    isConnected,
    connectionError,
    sendBeadSelected,
    sendRequestDetails,
    sendRequestBlockers,
    sendBeadRefresh,
    sendEpicNav,
    sendError,
  };
}
