import { test, expect, describe } from "bun:test";
import { spawn } from "bun";
import { resolve } from "path";

describe("Raw Mode Compatibility", () => {
  const CLI_PATH = resolve(import.meta.dir, "../cli.ts");
  const TIMEOUT = 5000;
  // Use process.execPath to get the current bun executable path
  // This works in CI (GitHub Actions) and local development
  const BUN_PATH = process.execPath;

  test("document canvas does not crash in non-TTY environment", async () => {
    const config = JSON.stringify({ content: "# Test", title: "Test" });

    const proc = spawn({
      cmd: [BUN_PATH, "run", CLI_PATH, "show", "document", "--config", config],
      cwd: resolve(import.meta.dir, "../.."),
      stdin: "ignore", // Non-TTY stdin
      stdout: "pipe",
      stderr: "pipe",
    });

    // Give it time to render
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Kill the process (it would run indefinitely otherwise)
    proc.kill();

    // Read any stderr output
    const stderr = await new Response(proc.stderr).text();

    // The critical assertion: should NOT contain "Raw mode is not supported"
    expect(stderr).not.toContain("Raw mode is not supported");
  });

  test("calendar canvas does not crash in non-TTY environment", async () => {
    const proc = spawn({
      cmd: [BUN_PATH, "run", CLI_PATH, "show", "calendar"],
      cwd: resolve(import.meta.dir, "../.."),
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    proc.kill();

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).not.toContain("Raw mode is not supported");
  });

  test("flight canvas does not crash in non-TTY environment", async () => {
    const config = JSON.stringify({
      flights: [
        {
          id: "test1",
          airline: "Test Air",
          flightNumber: "TA123",
          origin: { code: "SFO", name: "San Francisco" },
          destination: { code: "LAX", name: "Los Angeles" },
          departureTime: new Date().toISOString(),
          arrivalTime: new Date(Date.now() + 3600000).toISOString(),
          duration: 60,
          price: 199,
          class: "economy",
        },
      ],
    });

    const proc = spawn({
      cmd: [BUN_PATH, "run", CLI_PATH, "show", "flight", "--config", config],
      cwd: resolve(import.meta.dir, "../.."),
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    proc.kill();

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).not.toContain("Raw mode is not supported");
  });

  test("meeting-picker scenario does not crash in non-TTY environment", async () => {
    // Meeting picker requires a config with available slots
    const config = JSON.stringify({
      duration: 30,
      availableSlots: [
        {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 1800000).toISOString(),
        },
      ],
    });

    const proc = spawn({
      cmd: [
        BUN_PATH,
        "run",
        CLI_PATH,
        "show",
        "calendar",
        "--scenario",
        "meeting-picker",
        "--config",
        config,
      ],
      cwd: resolve(import.meta.dir, "../.."),
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    proc.kill();

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).not.toContain("Raw mode is not supported");
  });
});
