/**
 * BeadsCanvas - Main orchestration component for the Beads Canvas.
 * Combines HeaderBar, BeadTree, and StatusBar into a unified tree viewer.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, useApp, useStdout } from 'ink';
import type { BeadsConfig } from './types';
import { HeaderBar } from './components/header-bar';
import { StatusBar, type FocusMode } from './components/status-bar';
import { BeadTree, flattenTree } from './components/bead-tree';
import { DetailPanel } from './components/detail-panel';
import { useTreeNavigation, useBeadsIPC } from './hooks';

export interface BeadsCanvasProps {
  /** Unique canvas instance ID */
  id: string;
  /** Initial configuration */
  config?: BeadsConfig;
  /** IPC socket path for communication */
  socketPath?: string;
  /** Scenario name (for IPC) */
  scenario?: string;
}

/**
 * Main Beads Canvas component.
 * Orchestrates all sub-components for displaying hierarchical bead trees.
 */
export function BeadsCanvas({
  id,
  config: initialConfig,
  socketPath,
  scenario,
}: BeadsCanvasProps): React.JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 120,
    height: stdout?.rows || 40,
  });

  // Config (can be updated via IPC in future)
  const [config, setConfig] = useState<BeadsConfig | undefined>(initialConfig);

  // Tree state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Focus mode
  const [focusMode, setFocusMode] = useState<FocusMode>('tree');
  const [detailBeadId, setDetailBeadId] = useState<string | null>(null);

  // IPC connection for controller communication
  const ipc = useBeadsIPC({
    socketPath,
    scenario: scenario || 'display',
    onClose: () => exit(),
    onUpdate: (newConfig) => setConfig(newConfig),
    onShowDetails: (beadId) => {
      setDetailBeadId(beadId);
      setFocusMode('detail');
    },
  });

  // Listen for terminal resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: stdout?.columns || 120,
        height: stdout?.rows || 40,
      });
    };
    stdout?.on('resize', updateDimensions);
    updateDimensions();
    return () => {
      stdout?.off('resize', updateDimensions);
    };
  }, [stdout]);

  // Compute flattened tree
  const flattenedNodes = useMemo(
    () => flattenTree(config?.nodes || [], expandedIds),
    [config?.nodes, expandedIds]
  );

  // Layout calculation
  const HEADER_HEIGHT = 2;
  const FOOTER_HEIGHT = 2;
  const contentHeight = dimensions.height - HEADER_HEIGHT - FOOTER_HEIGHT;

  // Toggle expand/collapse handler
  const handleToggle = useCallback((beadId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(beadId)) {
        next.delete(beadId);
      } else {
        next.add(beadId);
      }
      return next;
    });
  }, []);

  // Details handler - request details via IPC
  const handleDetails = useCallback((beadId: string) => {
    ipc.sendRequestDetails(beadId);
    setDetailBeadId(beadId);
    setFocusMode('detail');
  }, [ipc]);

  // Refresh handler - request fresh data via IPC
  const handleRefresh = useCallback(() => {
    ipc.sendBeadRefresh();
  }, [ipc]);

  // Epic navigation handler - request epic switch via IPC
  const handleEpicNav = useCallback((direction: 'prev' | 'next') => {
    ipc.sendEpicNav(direction);
  }, [ipc]);

  // Quit handler
  const handleQuit = useCallback(() => {
    exit();
  }, [exit]);

  // Close detail panel handler
  const handleCloseDetail = useCallback(() => {
    setFocusMode('tree');
    setDetailBeadId(null);
  }, []);

  // Find the node for the detail panel
  const detailNode = useMemo(() => {
    if (!detailBeadId) return null;
    const flat = flattenedNodes.find((f) => f.node.id === detailBeadId);
    return flat?.node ?? null;
  }, [detailBeadId, flattenedNodes]);

  // Wire up navigation hook
  const { selectedIndex, scrollOffset } = useTreeNavigation({
    flattenedNodes,
    viewportHeight: contentHeight,
    onToggle: handleToggle,
    onDetails: handleDetails,
    onRefresh: handleRefresh,
    onEpicNav: handleEpicNav,
    onQuit: handleQuit,
  });

  // Send bead selection changes via IPC
  useEffect(() => {
    const selectedFlat = flattenedNodes[selectedIndex];
    if (selectedFlat && ipc.isConnected) {
      ipc.sendBeadSelected(selectedFlat.node.id);
    }
  }, [selectedIndex, flattenedNodes, ipc]);

  return (
    <Box
      flexDirection="column"
      width={dimensions.width}
      height={dimensions.height}
    >
      {/* Header */}
      <HeaderBar
        title={config?.title}
        epicIndex={config?.epicIndex ?? 1}
        totalEpics={config?.totalEpics ?? 1}
        width={dimensions.width}
      />

      {/* Main content area */}
      <Box flexDirection="row" height={contentHeight}>
        {/* Tree view */}
        <BeadTree
          nodes={flattenedNodes}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          viewportHeight={contentHeight}
          width={focusMode === 'detail' ? Math.floor(dimensions.width * 0.5) : dimensions.width}
        />

        {/* Detail panel */}
        {focusMode === 'detail' && detailNode && (
          <DetailPanel
            node={detailNode}
            onClose={handleCloseDetail}
            width={Math.floor(dimensions.width * 0.5)}
            height={contentHeight}
            isActive={focusMode === 'detail'}
          />
        )}
      </Box>

      {/* Footer */}
      <StatusBar width={dimensions.width} focusMode={focusMode} />
    </Box>
  );
}
