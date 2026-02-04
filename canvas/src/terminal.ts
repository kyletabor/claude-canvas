import { spawn, spawnSync } from "child_process";

export interface TerminalEnvironment {
  inTmux: boolean;
  summary: string;
}

export function detectTerminal(): TerminalEnvironment {
  const inTmux = !!process.env.TMUX;
  const summary = inTmux ? "tmux" : "no tmux";
  return { inTmux, summary };
}

export interface SpawnResult {
  method: string;
  pid?: number;
}

export interface SpawnOptions {
  socketPath?: string;
  scenario?: string;
}

export async function spawnCanvas(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectTerminal();

  if (!env.inTmux) {
    throw new Error("Canvas requires tmux. Please run inside a tmux session.");
  }

  // Get the directory of this script (skill directory)
  const scriptDir = import.meta.dir.replace("/src", "");
  const runScript = `${scriptDir}/run-canvas.sh`;

  // Auto-generate socket path for IPC if not provided
  const socketPath = options?.socketPath || `/tmp/canvas-${id}.sock`;

  // Build the command to run
  let command = `${runScript} show ${kind} --id ${id}`;
  if (configJson) {
    // Write config to a temp file to avoid shell escaping issues
    const configFile = `/tmp/canvas-config-${id}.json`;
    await Bun.write(configFile, configJson);
    command += ` --config "$(cat ${configFile})"`;
  }
  command += ` --socket ${socketPath}`;
  if (options?.scenario) {
    command += ` --scenario ${options.scenario}`;
  }

  const result = await spawnTmux(command);
  if (result) return { method: "tmux" };

  throw new Error("Failed to spawn tmux pane");
}

// Get session-specific pane tracking file
// Each tmux session gets its own file to prevent cross-session pane reuse
export function getCanvasPaneFile(): string {
  const result = spawnSync("tmux", ["display-message", "-p", "#{session_name}"]);

  // Check for spawn errors (e.g., tmux not installed)
  if (result.error) {
    console.warn(
      `[canvas] tmux command failed: ${result.error.message}. Using default session name.`
    );
    return "/tmp/claude-canvas-pane-id-default";
  }

  // Check for non-zero exit status (e.g., not in tmux session)
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim();
    console.warn(
      `[canvas] tmux returned status ${result.status}${stderr ? `: ${stderr}` : ""}. Using default session name.`
    );
    return "/tmp/claude-canvas-pane-id-default";
  }

  const sessionName = result.stdout?.toString().trim();

  // Check for empty session name
  if (!sessionName) {
    console.warn("[canvas] tmux returned empty session name. Using default.");
    return "/tmp/claude-canvas-pane-id-default";
  }

  // Sanitize session name for filesystem (replace special chars with underscore)
  const safeSessionName = sanitizeSessionName(sessionName);
  return `/tmp/claude-canvas-pane-id-${safeSessionName}`;
}

// Exported for testing
export function sanitizeSessionName(sessionName: string): string {
  return sessionName.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function getCanvasPaneId(): Promise<string | null> {
  try {
    const paneFile = getCanvasPaneFile();
    const file = Bun.file(paneFile);
    if (await file.exists()) {
      const paneId = (await file.text()).trim();
      if (!paneId) {
        return null;
      }
      // Verify the pane still exists by checking if tmux can find it
      const result = spawnSync("tmux", ["display-message", "-t", paneId, "-p", "#{pane_id}"]);
      const output = result.stdout?.toString().trim();
      // Pane exists only if command succeeds AND returns the same pane ID
      if (result.status === 0 && output === paneId) {
        return paneId;
      }
      // Stale pane reference - clean up the file
      await clearCanvasPaneFile(paneFile);
    }
  } catch (error) {
    // Log unexpected errors for debugging but continue gracefully
    console.warn(
      `[canvas] Error reading pane ID: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return null;
}

async function saveCanvasPaneId(paneId: string): Promise<void> {
  try {
    await Bun.write(getCanvasPaneFile(), paneId);
  } catch (error) {
    // Log but don't fail - pane was created, just tracking failed
    console.warn(
      `[canvas] Failed to save pane ID: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function clearCanvasPaneFile(paneFile: string): Promise<void> {
  try {
    await Bun.write(paneFile, "");
  } catch (error) {
    console.warn(
      `[canvas] Failed to clear pane file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function createNewPane(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Use split-window -h for vertical split (side by side)
    // -p 67 gives canvas 2/3 width (1:2 ratio, Claude:Canvas)
    // -P -F prints the new pane ID so we can save it
    const args = ["split-window", "-h", "-p", "67", "-P", "-F", "#{pane_id}", command];
    const proc = spawn("tmux", args);
    let paneId = "";
    proc.stdout?.on("data", (data) => {
      paneId += data.toString();
    });
    proc.on("close", async (code) => {
      if (code === 0 && paneId.trim()) {
        await saveCanvasPaneId(paneId.trim());
      }
      resolve(code === 0);
    });
    proc.on("error", () => resolve(false));
  });
}

async function reuseExistingPane(paneId: string, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Send Ctrl+C to interrupt any running process
    const killProc = spawn("tmux", ["send-keys", "-t", paneId, "C-c"]);
    killProc.on("close", () => {
      // Wait for process to terminate before sending new command
      setTimeout(() => {
        // Clear the terminal and run the new command
        const args = ["send-keys", "-t", paneId, `clear && ${command}`, "Enter"];
        const proc = spawn("tmux", args);
        proc.on("close", (code) => resolve(code === 0));
        proc.on("error", () => resolve(false));
      }, 500);
    });
    killProc.on("error", () => resolve(false));
  });
}

async function spawnTmux(command: string): Promise<boolean> {
  // Check if we have an existing canvas pane to reuse
  const existingPaneId = await getCanvasPaneId();

  if (existingPaneId) {
    // Try to reuse existing pane
    const reused = await reuseExistingPane(existingPaneId, command);
    if (reused) {
      return true;
    }
    // Reuse failed (pane may have been closed) - clear stale reference and create new
    await clearCanvasPaneFile(getCanvasPaneFile());
  }

  // Create a new split pane
  return createNewPane(command);
}

