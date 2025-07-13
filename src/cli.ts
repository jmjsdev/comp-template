#!/usr/bin/env node

import inquirer from "inquirer";
import { TemplateManager } from "./template-manager";
import { FileUtils, readFile } from "./file-utils";
import { installTemplates } from "./install";
import { ConfigManager } from "./config-manager";
import { Validators } from "./validators";
import { Template } from "./types";
import { TemplateValidator } from "./template-validator";
import path from "path";

/** Valid CLI command names */
type CommandName = "init" | "generate" | "install" | "config" | "update" | "validate" | "version";

/** Application path constants */
export const PATHS = {
  TEMPLATES_DIR: ".template",
  LEGACY_TEMPLATES_DIR: "./templates",
  CONFIG_FILE: "template.config.js",
  PACKAGE_TEMPLATES: path.join(__dirname, "../templates"),
} as const;

/** User-facing messages */
export const MESSAGES = {
  CONFIG_MANAGING: "📄 Managing template configuration...",
  CONFIG_UPDATING: "🔧 Updating template configuration...",
  INSTALL_MANUAL: "🔧 Manually installing templates...",
  INIT_START: "🚀 Initializing @jmjs/comp-template in your project...",
  INIT_SUCCESS: "🎉 @jmjs/comp-template initialization complete!",
  NO_CONFIG: "❌ No template.config.js found in current directory.",
  CONFIG_HINT: "💡 Run 'npx template config' to create a default configuration first.",
  NO_TEMPLATES: "❌ No templates found in the",
  INIT_NEEDED: "📋 @jmjs/comp-template needs to be initialized in this project.",
  INIT_HINT: "💡 Run 'npx template init' when you're ready to set up templates.",
  SUCCESS_GENERATED: "✅ Successfully generated",
} as const;

/**
 * CLI utility functions for common operations
 */
export class CLIUtils {
  /**
   * Handle errors and exit the process
   * @param error - The error to handle
   * @param exitCode - Exit code for the process (default: 1)
   */
  static async handleError(error: unknown, exitCode = 1): Promise<never> {
    console.error("Error:", error instanceof Error ? error.message : "An unknown error occurred");
    process.exit(exitCode);
  }

  /**
   * Prompt user to confirm overwriting an existing item
   * @param itemName - Name of the item to potentially overwrite
   * @param defaultValue - Default choice for the prompt
   * @returns Promise resolving to user's choice
   */
  static async confirmOverwrite(itemName: string, defaultValue = false): Promise<boolean> {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `${itemName} already exists. Overwrite?`,
        default: defaultValue,
      },
    ]);
    return overwrite;
  }

  /**
   * Get the templates directory path, checking both current and legacy locations
   * @returns Promise resolving to the templates directory path
   */
  static async getTemplatesDirectory(): Promise<string> {
    if (await FileUtils.pathExists(PATHS.TEMPLATES_DIR)) return PATHS.TEMPLATES_DIR;
    if (await FileUtils.pathExists(PATHS.LEGACY_TEMPLATES_DIR)) return PATHS.LEGACY_TEMPLATES_DIR;
    return PATHS.TEMPLATES_DIR;
  }

  /**
   * Validate user input for template names
   * @param input - The input string to validate
   * @returns True if valid, error message if invalid
   * @public for testing
   */
  public static validateNameInput(input: string): string | boolean {
    try {
      Validators.validateTemplateName(input);
      return true;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid name";
    }
  }

  /**
   * Prompt user for a name with validation
   * @param message - The prompt message
   * @returns Promise resolving to the entered name
   */
  static async promptForName(message: string): Promise<string> {
    const { name } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message,
        validate: CLIUtils.validateNameInput,
      },
    ]);
    return Validators.validateTemplateName(name);
  }

  /**
   * Log initialization success message with helpful information
   */
  static logInitSuccess(): void {
    console.log(`\n${MESSAGES.INIT_SUCCESS}`);
    console.log(`   📁 Templates are in ${PATHS.TEMPLATES_DIR}/`);
    console.log(`   ⚙️  Configuration is in ${PATHS.CONFIG_FILE}`);
    console.log("   🚀 Run 'npx template' to get started");
  }

  /**
   * Type guard to validate command names
   * @param command - The command string to validate
   * @returns True if command is valid
   */
  static validateCommandName(command: string): command is CommandName {
    return ["init", "generate", "install", "config", "update", "validate", "version"].includes(command);
  }

  /**
   * Display help information for available commands
   */
  static showHelp(): void {
    console.log("Available commands:");
    console.log("  init     - Initialize comp-template (templates + config) in your project");
    console.log("  generate - Generate files from templates (default)");
    console.log("  install  - Manually install templates (useful with npm link)");
    console.log("  config   - Create/update template.config.js");
    console.log("  update   - Update template configuration");
    console.log("  validate - Validate template syntax and structure");
    console.log("  version  - Display the current version");
  }
}

/**
 * Command implementations for the CLI
 */
export class Commands {
  /**
   * Create or update template configuration
   */
  static async config(): Promise<void> {
    console.log(MESSAGES.CONFIG_MANAGING);
    const configManager = new ConfigManager();
    await configManager.createDefaultConfig();
  }

  /**
   * Display the current version
   */
  static async version(): Promise<void> {
    try {
      // Read package.json from the package root directory
      const packageJsonPath = path.join(__dirname, "../package.json");
      const packageJsonContent = await readFile(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);
      
      console.log(`@jmjs/comp-template v${packageJson.version}`);
    } catch (error) {
      console.error("⚠️  Could not read version from package.json");
    }
  }

  /**
   * Update existing template configuration
   */
  static async update(): Promise<void> {
    console.log(MESSAGES.CONFIG_UPDATING);
    const configManager = new ConfigManager();

    if (!(await FileUtils.pathExists(PATHS.CONFIG_FILE))) {
      console.log(MESSAGES.NO_CONFIG);
      console.log(MESSAGES.CONFIG_HINT);
      return;
    }

    await configManager.updateConfig();
  }

  /**
   * Manually install templates from package
   */
  static async install(): Promise<void> {
    console.log(MESSAGES.INSTALL_MANUAL);
    await installTemplates();
  }

  /**
   * Initialize comp-template in the current project
   */
  static async init(): Promise<void> {
    console.log(MESSAGES.INIT_START);

    try {
      await Commands.initializeTemplates();
      await Commands.initializeConfig();
      CLIUtils.logInitSuccess();
    } catch (error) {
      await CLIUtils.handleError(error);
    }
  }

  /**
   * Initialize templates directory with package templates
   * @private
   */
  private static async initializeTemplates(): Promise<void> {
    const targetTemplatesDir = path.join(process.cwd(), PATHS.TEMPLATES_DIR);

    if (await FileUtils.pathExists(targetTemplatesDir)) {
      const shouldOverwrite = await CLIUtils.confirmOverwrite("Templates directory (.template)");
      if (!shouldOverwrite) {
        console.log("Init cancelled. Existing templates directory not modified.");
        return;
      }
    }

    if (!(await FileUtils.pathExists(PATHS.PACKAGE_TEMPLATES))) {
      console.log("⚠️  No templates found in package. Cannot initialize templates.");
      console.log("   Please reinstall comp-template or check the package integrity.");
      return;
    }

    await FileUtils.copy(PATHS.PACKAGE_TEMPLATES, targetTemplatesDir, { overwrite: true });
    console.log(`✅ Templates successfully initialized in ${PATHS.TEMPLATES_DIR}/`);
    console.log("   You can now add your own templates to this directory.");
  }

  /**
   * Initialize configuration file
   * @private
   */
  private static async initializeConfig(): Promise<void> {
    const configManager = new ConfigManager();

    if (await FileUtils.pathExists(PATHS.CONFIG_FILE)) {
      const shouldOverwrite = await CLIUtils.confirmOverwrite(PATHS.CONFIG_FILE);
      if (shouldOverwrite) {
        await configManager.createDefaultConfig();
      } else {
        console.log(`✅ Existing ${PATHS.CONFIG_FILE} preserved.`);
      }
    } else {
      await configManager.createDefaultConfig();
    }
  }

  /**
   * Generate files from templates
   */
  static async generate(): Promise<void> {
    try {
      const templatesDir = await CLIUtils.getTemplatesDirectory();
      const templateManager = new TemplateManager(templatesDir);
      const configManager = new ConfigManager();

      const templates = await templateManager.listTemplates();

      if (templates.length === 0) {
        return await Commands.handleNoTemplates(templatesDir);
      }

      await Commands.executeGeneration(templateManager, configManager, templates);
    } catch (error) {
      await CLIUtils.handleError(error);
    }
  }

  /**
   * Handle case when no templates are found
   * @param templatesDir - The templates directory path
   * @private
   */
  private static async handleNoTemplates(templatesDir: string): Promise<void> {
    console.log(`${MESSAGES.NO_TEMPLATES} ${templatesDir} directory`);
    console.log(MESSAGES.INIT_NEEDED);
    console.log("");

    const { shouldInit } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldInit",
        message: "Would you like to initialize comp-template now?",
        default: true,
      },
    ]);

    if (shouldInit) {
      await Commands.init();
      return Commands.generate();
    } else {
      console.log(MESSAGES.INIT_HINT);
      process.exit(1);
    }
  }

  /**
   * Execute the template generation process
   * @param templateManager - Template manager instance
   * @param configManager - Config manager instance
   * @param templates - Available templates
   * @private
   */
  private static async executeGeneration(templateManager: TemplateManager, configManager: ConfigManager, templates: Template[]): Promise<void> {
    const config = await configManager.loadConfig();
    
    // Créer un nouveau TemplateManager avec la configuration
    const templatesDir = await CLIUtils.getTemplatesDirectory();
    const configuredTemplateManager = new TemplateManager(templatesDir, config);

    const { templateName } = await inquirer.prompt([
      {
        type: "list",
        name: "templateName",
        message: "Choose a template:",
        choices: templates.map((t) => ({
          name: `${t.name} (${t.type})`,
          value: t.name,
        })),
      },
    ]);

    const componentName = await CLIUtils.promptForName("Enter the name for your component/file:");

    const { selectedDirectory } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedDirectory",
        message: "Choose output directory:",
        choices: config.outputDirectories.map((dir) => ({
          name: dir.description ? `${dir.name} (${dir.path}) - ${dir.description}` : `${dir.name} (${dir.path})`,
          value: dir.path,
        })),
      },
    ]);

    const { dryRun } = await inquirer.prompt([
      {
        type: "confirm",
        name: "dryRun",
        message: "Preview files before generating? (dry-run mode)",
        default: false,
      },
    ]);

    await FileUtils.ensureDir(selectedDirectory);
    await configuredTemplateManager.generateFromTemplate(templateName, componentName, selectedDirectory, { dryRun });

    if (dryRun) {
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Proceed with generation?",
          default: true,
        },
      ]);

      if (proceed) {
        await configuredTemplateManager.generateFromTemplate(templateName, componentName, selectedDirectory, { dryRun: false });
        console.log(`${MESSAGES.SUCCESS_GENERATED} ${componentName} from template ${templateName} in ${selectedDirectory}`);
      } else {
        console.log("Generation cancelled.");
      }
    } else {
      console.log(`${MESSAGES.SUCCESS_GENERATED} ${componentName} from template ${templateName} in ${selectedDirectory}`);
    }
  }

  /**
   * Validate templates for syntax and structure issues
   */
  static async validate(): Promise<void> {
    const templatesDir = await CLIUtils.getTemplatesDirectory();

    if (!(await FileUtils.pathExists(templatesDir))) {
      console.log(`${MESSAGES.NO_TEMPLATES} ${templatesDir} directory`);
      console.log(MESSAGES.INIT_HINT);
      return;
    }

    console.log("🔍 Validating templates...\n");

    const results = await TemplateValidator.validateAll(templatesDir);
    let hasErrors = false;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const [templateName, result] of results) {
      if (!result.valid || result.warnings.length > 0) {
        console.log(`📁 ${templateName}:`);

        if (result.errors.length > 0) {
          hasErrors = true;
          totalErrors += result.errors.length;
          console.log("  ❌ Errors:");
          result.errors.forEach((error) => console.log(`     - ${error}`));
        }

        if (result.warnings.length > 0) {
          totalWarnings += result.warnings.length;
          console.log("  ⚠️  Warnings:");
          result.warnings.forEach((warning) => console.log(`     - ${warning}`));
        }

        console.log();
      }
    }

    if (!hasErrors && totalWarnings === 0) {
      console.log("✅ All templates are valid!\n");
    } else {
      console.log("📊 Summary:");
      console.log(`   Templates checked: ${results.size}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Warnings: ${totalWarnings}\n`);

      if (hasErrors) {
        console.log("❌ Please fix the errors before using these templates.");
        process.exit(1);
      }
    }
  }
}

/** Command mapping for CLI */
const commands: Record<CommandName, () => Promise<void>> = {
  config: Commands.config,
  update: Commands.update,
  install: Commands.install,
  init: Commands.init,
  generate: Commands.generate,
  validate: Commands.validate,
  version: Commands.version,
};

/**
 * Main CLI entry point
 */
export async function main() {
  const args = process.argv.slice(2);
  const commandArg = args[0] || "generate";

  if (CLIUtils.validateCommandName(commandArg)) {
    await commands[commandArg]();
  } else {
    console.log(`Unknown command: ${commandArg}`);
    CLIUtils.showHelp();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
