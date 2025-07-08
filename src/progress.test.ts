import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { ProgressIndicator } from "./progress";

describe("ProgressIndicator", () => {
  let originalIsTTY: boolean;
  let consoleLogs: string[] = [];
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    originalIsTTY = process.stdout.isTTY;
    originalConsoleLog = console.log;
    consoleLogs = [];
    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };
  });

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
    console.log = originalConsoleLog;
  });

  test("should create progress indicator with total steps", () => {
    const progress = new ProgressIndicator(10);
    assert(progress instanceof ProgressIndicator);
  });

  test("should start progress with message", () => {
    const progress = new ProgressIndicator();
    progress.start(5, "Starting process");
    
    assert(consoleLogs.some(log => log.includes("Starting process")));
  });

  test("should increment progress", () => {
    const progress = new ProgressIndicator();
    progress.start(3, "Test process");
    progress.increment("Step 1");
    
    assert(consoleLogs.some(log => log.includes("Step 1")));
  });

  test("should complete progress", () => {
    const progress = new ProgressIndicator();
    progress.start(2, "Test process");
    progress.increment();
    progress.complete("Finished");
    
    assert(consoleLogs.some(log => log.includes("Finished")));
  });

  test("should handle disabled progress indicator", () => {
    const progress = new ProgressIndicator(5, false);
    progress.start(5, "Disabled test");
    progress.increment("Step 1");
    progress.complete("Done");
    
    // Should not log anything when disabled
    assert.strictEqual(consoleLogs.length, 0);
  });

  test("should create spinner", () => {
    const spinner = ProgressIndicator.createSpinner("Loading...");
    assert(typeof spinner.start === "function");
    assert(typeof spinner.stop === "function");
  });

  test("should handle spinner start and stop", () => {
    // Mock TTY
    process.stdout.isTTY = false;
    
    const spinner = ProgressIndicator.createSpinner("Loading...");
    spinner.start();
    spinner.stop();
    
    assert(consoleLogs.some(log => log.includes("Loading...")));
  });

  test("should handle non-TTY environment", () => {
    process.stdout.isTTY = false;
    
    const progress = new ProgressIndicator();
    progress.start(3, "Non-TTY test");
    progress.increment("Step 1");
    progress.complete("Done");
    
    // Should still log messages in non-TTY
    assert(consoleLogs.length > 0);
  });
});