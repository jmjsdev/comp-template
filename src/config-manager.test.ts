import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { unlink, writeFile } from "node:fs/promises";
import { ConfigManager } from "./config-manager";
import { TemplateConfig } from "./types";

const TEST_CONFIG_FILE = "test-template.config.js";

/**
 * Test configuration content in CommonJS format
 */
const testConfigContent = `
module.exports = {
  outputDirectories: [
    { name: "Test Components", path: "./test/components", description: "Test components directory" },
    { name: "Test Utils", path: "./test/utils", description: "Test utilities" },
    { name: "Current Directory", path: ".", description: "Generate in current directory" }
  ]
};
`;

describe("ConfigManager", () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager(TEST_CONFIG_FILE);
  });

  afterEach(async () => {
    try {
      await unlink(TEST_CONFIG_FILE);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe("loadConfig", () => {
    test("should create default config if file doesn't exist", async () => {
      const config = await configManager.loadConfig();

      assert(Array.isArray(config.outputDirectories));
      assert(config.outputDirectories.length > 0);
      assert(config.outputDirectories.some((dir) => dir.path === "."));
    });

    test("should load existing config file", async () => {
      await writeFile(TEST_CONFIG_FILE, testConfigContent);

      const config = await configManager.loadConfig();

      assert(Array.isArray(config.outputDirectories));
      assert(config.outputDirectories.some((dir) => dir.name === "Test Components"));
      assert(config.outputDirectories.some((dir) => dir.name === "Test Utils"));
    });
  });

  describe("createDefaultConfig", () => {
    test("should create config file with default directories", async () => {
      await configManager.createDefaultConfig();

      const config = await configManager.loadConfig();
      assert(Array.isArray(config.outputDirectories));
      assert(config.outputDirectories.length > 0);
    });
  });

  test("should validate config structure", async () => {
    const configManager = new ConfigManager("test-config-validation.json");
    const config = await configManager.loadConfig();

    assert(Array.isArray(config.outputDirectories));
    assert(config.outputDirectories.length > 0);

    config.outputDirectories.forEach((dir) => {
      assert(typeof dir.name === "string");
      assert(typeof dir.path === "string");
      assert(dir.name.length > 0);
      assert(dir.path.length > 0);
    });
  });

  test("should ensure current directory is always present", async () => {
    const configManager = new ConfigManager("test-config-current-dir.json");
    const config = await configManager.loadConfig();

    const hasCurrentDir = config.outputDirectories.some((dir) => dir.path === ".");
    assert(hasCurrentDir, "Configuration should always include current directory option");
  });

  test("should handle configuration creation", async () => {
    const configManager = new ConfigManager();
    assert(typeof configManager.createDefaultConfig === "function");
    assert(typeof configManager.loadConfig === "function");
  });
});
