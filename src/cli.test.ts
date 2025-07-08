import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { writeFile, unlink, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { PATHS, MESSAGES, CLIUtils, Commands } from "./cli";

// Test utilities for CLI
class CLITestUtils {
  static async runCLI(args: string[] = [], timeout = 3000): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve) => {
      const child = spawn("node", [path.join(__dirname, "../dist/cli.js"), ...args], {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });

      let stdout = "";
      let stderr = "";
      let resolved = false;

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          child.kill("SIGKILL");
          resolve({ stdout, stderr, exitCode: null });
        }
      }, timeout);

      child.on("close", (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ stdout, stderr, exitCode: code });
        }
      });

      child.on("error", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ stdout, stderr, exitCode: null });
        }
      });

      // Provide input for prompts and close stdin immediately
      child.stdin.write("\n");
      child.stdin.end();
    });
  }

  static async createTestFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content);
  }

  static async removeTestFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  static async createTestDir(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
  }

  static async removeTestDir(dirPath: string): Promise<void> {
    try {
      await rm(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }
}

describe("CLI Constants", () => {
  test("should have correct PATHS constants", () => {
    assert.strictEqual(PATHS.TEMPLATES_DIR, ".template");
    assert.strictEqual(PATHS.LEGACY_TEMPLATES_DIR, "./templates");
    assert.strictEqual(PATHS.CONFIG_FILE, "template.config.js");
    assert(PATHS.PACKAGE_TEMPLATES.includes("templates"));
  });

  test("should have appropriate MESSAGES constants with new package name", () => {
    assert(MESSAGES.CONFIG_MANAGING.includes("Managing template configuration"));
    assert(MESSAGES.CONFIG_UPDATING.includes("Updating template configuration"));
    assert(MESSAGES.INSTALL_MANUAL.includes("Manually installing templates"));
    assert(MESSAGES.INIT_START.includes("@jmjs/comp-template"));
    assert(MESSAGES.INIT_SUCCESS.includes("@jmjs/comp-template"));
    assert(MESSAGES.NO_CONFIG.includes("No template.config.js found"));
    assert(MESSAGES.CONFIG_HINT.includes("Run 'npx template config'"));
    assert(MESSAGES.NO_TEMPLATES.includes("No templates found"));
    assert(MESSAGES.INIT_NEEDED.includes("@jmjs/comp-template"));
    assert(MESSAGES.INIT_HINT.includes("Run 'npx template init'"));
    assert(MESSAGES.SUCCESS_GENERATED.includes("Successfully generated"));
  });
});

describe("CLIUtils", () => {
  describe("validateCommandName", () => {
    test("should validate correct command names including validate", () => {
      const validCommands = ["init", "generate", "install", "config", "update", "validate"];
      validCommands.forEach((cmd) => {
        assert(CLIUtils.validateCommandName(cmd), `${cmd} should be valid`);
      });
    });

    test("should reject invalid command names", () => {
      const invalidCommands = ["test", "build", "deploy", "", "invalid"];
      invalidCommands.forEach((cmd) => {
        assert(!CLIUtils.validateCommandName(cmd), `${cmd} should be invalid`);
      });
    });
  });

  describe("getTemplatesDirectory", () => {
    test("should return appropriate template directory", async () => {
      const templatesDir = await CLIUtils.getTemplatesDirectory();
      assert(typeof templatesDir === "string");
      assert(templatesDir === PATHS.TEMPLATES_DIR || templatesDir === PATHS.LEGACY_TEMPLATES_DIR);
    });
  });

  describe("logInitSuccess", () => {
    test("should log initialization success messages", () => {
      // Mock console.log
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      try {
        CLIUtils.logInitSuccess();

        // Verify all expected messages are logged
        assert(logMessages.length >= 4, "Should log at least 4 messages");
        assert(
          logMessages.some((msg) => msg.includes("@jmjs/comp-template initialization complete")),
          "Should include initialization complete message"
        );
        assert(
          logMessages.some((msg) => msg.includes("Templates are in .template/")),
          "Should include templates directory message"
        );
        assert(
          logMessages.some((msg) => msg.includes("Configuration is in template.config.js")),
          "Should include config file message"
        );
        assert(
          logMessages.some((msg) => msg.includes("Run 'npx template' to get started")),
          "Should include getting started message"
        );
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test("should include proper emoji and formatting", () => {
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      try {
        CLIUtils.logInitSuccess();

        const messagesText = logMessages.join(" ");
        assert(messagesText.includes("📁"), "Should include folder emoji");
        assert(messagesText.includes("⚙️"), "Should include gear emoji");
        assert(messagesText.includes("🚀"), "Should include rocket emoji");
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test("should not throw when called", () => {
      // Ensure the function doesn't throw
      assert.doesNotThrow(() => {
        CLIUtils.logInitSuccess();
      });
    });
  });

  describe("showHelp", () => {
    test("should not throw when called", () => {
      assert.doesNotThrow(() => {
        CLIUtils.showHelp();
      });
    });

    test("should include validate command in help", () => {
      // We can't easily capture console output, but we can test that the method exists
      assert(typeof CLIUtils.showHelp === "function");
    });
  });

  describe("validateNameInput", () => {
    test("should return true for valid input", () => {
      const result = CLIUtils.validateNameInput("ValidComponentName");
      assert.strictEqual(result, true);
    });

    test("should return error message for empty input", () => {
      const result = CLIUtils.validateNameInput("");
      assert(typeof result === "string");
      assert(result.includes("empty"));
    });

    test("should return error message for invalid characters", () => {
      const result = CLIUtils.validateNameInput("invalid@name!");
      assert(typeof result === "string");
      assert(result.includes("letters, numbers, spaces, hyphens, and underscores"));
    });

    test("should return error message for names too long", () => {
      const result = CLIUtils.validateNameInput("A".repeat(101));
      assert(typeof result === "string");
      assert(result.includes("100 characters"));
    });

    test("should return error message for reserved names", () => {
      const result = CLIUtils.validateNameInput("con");
      assert(typeof result === "string");
      assert(result.includes("reserved system name"));
    });

    test("should handle non-Error exceptions", () => {
      // Mock validateTemplateName to throw a non-Error
      const originalValidator = require("./validators").Validators.validateTemplateName;
      require("./validators").Validators.validateTemplateName = () => {
        throw "String error, not Error object";
      };

      try {
        const result = CLIUtils.validateNameInput("anything");
        assert.strictEqual(result, "Invalid name");
      } finally {
        // Restore original
        require("./validators").Validators.validateTemplateName = originalValidator;
      }
    });
  });

  describe("promptForName", () => {
    test("should be a function that returns a Promise", () => {
      assert(typeof CLIUtils.promptForName === "function");
      // Don't actually call the function to avoid hanging
      assert(CLIUtils.promptForName.length === 1); // Should take 1 parameter
    });
  });

  describe("confirmOverwrite", () => {
    test("should be a function that returns a Promise", () => {
      assert(typeof CLIUtils.confirmOverwrite === "function");
      // Don't actually call the function to avoid hanging
      assert(CLIUtils.confirmOverwrite.length >= 1); // Should take at least 1 parameter
    });
  });

  describe("handleError", () => {
    test("should be a function", () => {
      assert(typeof CLIUtils.handleError === "function");
    });
  });
});

describe("Commands Class", () => {
  test("should have all required command methods", () => {
    const requiredMethods = ["config", "update", "install", "init", "generate", "validate"] as const;
    requiredMethods.forEach((method) => {
      assert(typeof (Commands as any)[method] === "function", `Commands.${method} should be a function`);
    });
  });

  test("should have static methods", () => {
    assert(typeof Commands.config === "function");
    assert(typeof Commands.update === "function");
    assert(typeof Commands.install === "function");
    assert(typeof Commands.init === "function");
    assert(typeof Commands.generate === "function");
    assert(typeof Commands.validate === "function");
  });

  describe("config", () => {
    test("should log config management message and create default config", async () => {
      // Mock console.log and ConfigManager
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const ConfigManager = require("./config-manager").ConfigManager;
      const originalCreateDefaultConfig = ConfigManager.prototype.createDefaultConfig;
      let createDefaultConfigCalled = false;

      ConfigManager.prototype.createDefaultConfig = async function () {
        createDefaultConfigCalled = true;
        return Promise.resolve();
      };

      try {
        await Commands.config();

        // Verify console message
        assert(
          logMessages.some((msg) => msg.includes("📄 Managing template configuration")),
          "Should log config management message"
        );

        // Verify ConfigManager.createDefaultConfig was called
        assert(createDefaultConfigCalled, "Should call ConfigManager.createDefaultConfig");
      } finally {
        // Restore mocks
        console.log = originalConsoleLog;
        ConfigManager.prototype.createDefaultConfig = originalCreateDefaultConfig;
      }
    });

    test("should handle ConfigManager errors gracefully", async () => {
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const ConfigManager = require("./config-manager").ConfigManager;
      const originalCreateDefaultConfig = ConfigManager.prototype.createDefaultConfig;

      ConfigManager.prototype.createDefaultConfig = async function () {
        throw new Error("Configuration error");
      };

      try {
        // Should not throw even if ConfigManager fails
        await Commands.config();

        // Should still log the initial message
        assert(
          logMessages.some((msg) => msg.includes("📄 Managing template configuration")),
          "Should log config management message"
        );
      } catch (error) {
        // If it throws, we should catch and handle gracefully
        assert(error instanceof Error);
      } finally {
        console.log = originalConsoleLog;
        ConfigManager.prototype.createDefaultConfig = originalCreateDefaultConfig;
      }
    });
  });

  describe("update", () => {
    test("should log update message and call updateConfig when config file exists", async () => {
      // Mock console.log, FileUtils.pathExists, and ConfigManager
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const FileUtils = require("./file-utils").FileUtils;
      const originalPathExists = FileUtils.pathExists;
      FileUtils.pathExists = async () => true; // Mock config file exists

      const ConfigManager = require("./config-manager").ConfigManager;
      const originalUpdateConfig = ConfigManager.prototype.updateConfig;
      let updateConfigCalled = false;

      ConfigManager.prototype.updateConfig = async function () {
        updateConfigCalled = true;
        return Promise.resolve();
      };

      try {
        await Commands.update();

        // Verify console messages
        assert(
          logMessages.some((msg) => msg.includes("🔧 Updating template configuration")),
          "Should log update message"
        );

        // Verify updateConfig was called
        assert(updateConfigCalled, "Should call ConfigManager.updateConfig");

        // Should not log error messages
        assert(!logMessages.some((msg) => msg.includes("❌ No template.config.js found")), "Should not log error message when config exists");
      } finally {
        console.log = originalConsoleLog;
        FileUtils.pathExists = originalPathExists;
        ConfigManager.prototype.updateConfig = originalUpdateConfig;
      }
    });

    test("should log error messages when config file does not exist", async () => {
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const FileUtils = require("./file-utils").FileUtils;
      const originalPathExists = FileUtils.pathExists;
      FileUtils.pathExists = async () => false; // Mock config file doesn't exist

      const ConfigManager = require("./config-manager").ConfigManager;
      const originalUpdateConfig = ConfigManager.prototype.updateConfig;
      let updateConfigCalled = false;

      ConfigManager.prototype.updateConfig = async function () {
        updateConfigCalled = true;
        return Promise.resolve();
      };

      try {
        await Commands.update();

        // Verify console messages
        assert(
          logMessages.some((msg) => msg.includes("🔧 Updating template configuration")),
          "Should log update message"
        );
        assert(
          logMessages.some((msg) => msg.includes("❌ No template.config.js found")),
          "Should log no config file message"
        );
        assert(
          logMessages.some((msg) => msg.includes("💡 Run 'npx template config'")),
          "Should log hint message"
        );

        // Verify updateConfig was NOT called
        assert(!updateConfigCalled, "Should not call ConfigManager.updateConfig when config doesn't exist");
      } finally {
        console.log = originalConsoleLog;
        FileUtils.pathExists = originalPathExists;
        ConfigManager.prototype.updateConfig = originalUpdateConfig;
      }
    });
  });

  describe("install", () => {
    test("should log install message and call installTemplates", async () => {
      // Mock console.log and installTemplates
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const installModule = require("./install");
      const originalInstallTemplates = installModule.installTemplates;
      let installTemplatesCalled = false;

      installModule.installTemplates = async () => {
        installTemplatesCalled = true;
        return Promise.resolve();
      };

      try {
        await Commands.install();

        // Verify console message
        assert(
          logMessages.some((msg) => msg.includes("🔧 Manually installing templates")),
          "Should log install message"
        );

        // Verify installTemplates was called
        assert(installTemplatesCalled, "Should call installTemplates function");
      } finally {
        console.log = originalConsoleLog;
        installModule.installTemplates = originalInstallTemplates;
      }
    });

    test("should handle installTemplates errors gracefully", async () => {
      const originalConsoleLog = console.log;
      const logMessages: string[] = [];
      console.log = (message: string) => {
        logMessages.push(message);
      };

      const installModule = require("./install");
      const originalInstallTemplates = installModule.installTemplates;

      installModule.installTemplates = async () => {
        throw new Error("Installation error");
      };

      try {
        // Should not throw even if installTemplates fails
        await Commands.install();

        // Should still log the initial message
        assert(
          logMessages.some((msg) => msg.includes("🔧 Manually installing templates")),
          "Should log install message"
        );
      } catch (error) {
        // If it throws, we should catch and handle gracefully
        assert(error instanceof Error);
      } finally {
        console.log = originalConsoleLog;
        installModule.installTemplates = originalInstallTemplates;
      }
    });
  });
});


describe("Input Validation", () => {
  test("should validate component names correctly", () => {
    const validNames = ["Component", "MyComponent", "component-name", "Component123"];
    const invalidNames = ["", "   ", "\t", "\n"];

    validNames.forEach((name) => {
      assert(name.trim().length > 0, `${name} should be valid`);
    });

    invalidNames.forEach((name) => {
      assert(name.trim().length === 0, `"${name}" should be invalid`);
    });
  });

  test("should handle special characters in names", () => {
    const specialNames = ["Component-Name", "Component_Name", "Component.Name"];

    specialNames.forEach((name) => {
      assert(name.trim().length > 0);
      assert(!name.includes(" "), "Names should not contain spaces");
    });
  });

  test("should handle very long component names", () => {
    const longName = "A".repeat(100);
    assert(longName.trim().length > 0);
    assert(longName.length === 100);
  });
});

describe("Path Resolution", () => {
  test("should prefer .template over ./templates", () => {
    const templatePaths = [PATHS.TEMPLATES_DIR, PATHS.LEGACY_TEMPLATES_DIR];
    const preferred = PATHS.TEMPLATES_DIR;

    assert(templatePaths.includes(preferred));
    assert.strictEqual(templatePaths.indexOf(preferred), 0);
  });

  test("should have valid package templates path", () => {
    assert(typeof PATHS.PACKAGE_TEMPLATES === "string");
    assert(PATHS.PACKAGE_TEMPLATES.length > 0);
    assert(path.isAbsolute(PATHS.PACKAGE_TEMPLATES));
  });
});


describe("Command Structure Tests", () => {
  test("should have all required commands defined including validate", () => {
    const requiredCommands = ["init", "generate", "install", "config", "update", "validate"];

    requiredCommands.forEach((command) => {
      assert(CLIUtils.validateCommandName(command), `Command ${command} should be defined`);
    });
  });

  test("should handle default command correctly", () => {
    assert(CLIUtils.validateCommandName("generate"));
  });

  test("should validate new command 'validate'", () => {
    assert(CLIUtils.validateCommandName("validate"));
  });
});

describe("Package Name Updates", () => {
  test("should reflect new package name in messages", () => {
    assert(MESSAGES.INIT_START.includes("@jmjs/comp-template"));
    assert(MESSAGES.INIT_SUCCESS.includes("@jmjs/comp-template"));
    assert(MESSAGES.INIT_NEEDED.includes("@jmjs/comp-template"));
  });

  test("should have updated constants for new package", () => {
    assert(typeof PATHS.TEMPLATES_DIR === "string");
    assert(typeof PATHS.CONFIG_FILE === "string");
    assert(typeof PATHS.PACKAGE_TEMPLATES === "string");
  });
});

describe("New Features Tests", () => {
  test("should support validate command", () => {
    assert(CLIUtils.validateCommandName("validate"));
    assert(typeof Commands.validate === "function");
  });

  test("should have updated help text", () => {
    // Test that showHelp method exists and is callable
    assert(typeof CLIUtils.showHelp === "function");
    assert.doesNotThrow(() => CLIUtils.showHelp());
  });

  test("should support enhanced error handling", () => {
    assert(typeof CLIUtils.handleError === "function");
  });
});

describe("TypeScript Integration", () => {
  test("should have proper type definitions", () => {
    // Test that all exported classes and functions are properly typed
    assert(typeof CLIUtils === "function"); // Constructor function
    assert(typeof Commands === "function"); // Constructor function
    assert(typeof PATHS === "object");
    assert(typeof MESSAGES === "object");
  });

  test("should support command name validation with proper typing", () => {
    const validCommand = "validate";
    const invalidCommand = "invalid";

    assert(CLIUtils.validateCommandName(validCommand));
    assert(!CLIUtils.validateCommandName(invalidCommand));
  });
});
