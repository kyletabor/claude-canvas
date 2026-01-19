import { test, expect, describe } from "bun:test";
import { spawn } from "bun";
import { resolve } from "path";

describe("Raw Mode Compatibility", () => {
  const CLI_PATH = resolve(import.meta.dir, "../cli.ts");
  const TIMEOUT = 5000;

  test("document canvas does not crash in non-TTY environment", async () => {
    const config = JSON.stringify({ content: "# Test", title: "Test" });

    const proc = spawn({
      cmd: ["bun", "run", CLI_PATH, "show", "document", "--config", config],
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
      cmd: ["bun", "run", CLI_PATH, "show", "calendar"],
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
      cmd: ["bun", "run", CLI_PATH, "show", "flight", "--config", config],
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
