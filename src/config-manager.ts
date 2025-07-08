import path from "path";
import inquirer from "inquirer";
import { TemplateConfig, OutputDirectory } from "./types";
import { FileUtils, readFile, writeFile } from "./file-utils";
import { Validators } from "./validators";

/**
 * Manages template configuration including loading, saving, and updating config files
 */
export class ConfigManager {
  private configFile: string;
  private defaultConfig: TemplateConfig;

  /**
   * Create a new ConfigManager instance
   * @param configFile - Configuration file path (default: "template.config.js")
   */
  constructor(configFile: string = "template.config.js") {
    this.configFile = configFile;
    this.defaultConfig = {
      outputDirectories: [
        {
          name: "Current directory",
          path: ".",
          description: "Generate in the current directory",
        },
      ],
    };
  }

  /**
   * Check if the target project uses ES modules
   * @returns Promise resolving to true if project uses ES modules
   * @private
   */
  private async isESModule(): Promise<boolean> {
    try {
      const packageJsonPath = path.resolve("package.json");
      if (await FileUtils.pathExists(packageJsonPath)) {
        const packageJsonContent = await readFile(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonContent);
        return packageJson.type === "module";
      }
    } catch (error) {
      // Default to CommonJS if package.json cannot be read
    }
    return false;
  }

  /**
   * Generate configuration file content based on module type
   * @param config - Configuration object to serialize
   * @returns Promise resolving to formatted configuration string
   * @private
   */
  private async generateConfigContent(config: TemplateConfig): Promise<string> {
    const isESM = await this.isESModule();

    const configJson = JSON.stringify(config, null, 2);

    return isESM ? `export default ${configJson};` : `module.exports = ${configJson};`;
  }

  /**
   * Get the complete default configuration with common output directories
   * @returns Default template configuration
   * @private
   */
  private getDefaultFullConfig(): TemplateConfig {
    return {
      outputDirectories: [
        {
          name: "Components",
          path: "src/components",
          description: "React components directory",
        },
        {
          name: "Pages",
          path: "src/pages",
          description: "Application pages",
        },
        {
          name: "Utils",
          path: "src/utils",
          description: "Utility functions and helpers",
        },
        {
          name: "Hooks",
          path: "src/hooks",
          description: "Custom React hooks",
        },
        {
          name: "Current directory",
          path: ".",
          description: "Generate in the current directory",
        },
      ],
    };
  }

  /**
   * Validate that input is not empty
   * @param input - Input string to validate
   * @returns Validation result or error message
   * @private
   */
  private validateNonEmpty(input: string): string | boolean {
    return input.trim() !== "" || "This field cannot be empty";
  }

  /**
   * Load configuration file using appropriate method based on module type
   * @returns Promise resolving to loaded configuration
   * @private
   */
  private async loadConfigFile(): Promise<TemplateConfig> {
    const absolutePath = path.resolve(this.configFile);
    const isESM = await this.isESModule();

    if (isESM) {
      // For ES modules, use dynamic import with file:// protocol
      const configModule = await import(`file://${absolutePath}`);
      return configModule.default || configModule;
    } else {
      // For CommonJS, clear cache and use dynamic import to avoid require
      // This makes the code more consistent and avoids mixing module systems
      const module = { exports: {} };
      const exports = module.exports;
      const configContent = await readFile(absolutePath, 'utf8');
      
      // Create a function to evaluate the CommonJS module
      const evalFunc = new Function('module', 'exports', '__dirname', '__filename', configContent);
      evalFunc(module, exports, path.dirname(absolutePath), absolutePath);
      
      return module.exports as TemplateConfig;
    }
  }

  /**
   * Load template configuration from file or create default
   * @returns Promise resolving to template configuration
   */
  async loadConfig(): Promise<TemplateConfig> {
    try {
      if (await FileUtils.pathExists(this.configFile)) {
        const config = await this.loadConfigFile();

        if (!config.outputDirectories || !Array.isArray(config.outputDirectories)) {
          console.warn("⚠️  Invalid template.config.js format. Using default configuration.");
          return this.defaultConfig;
        }

        const hasCurrentDir = config.outputDirectories.some((dir) => dir.path === ".");
        if (!hasCurrentDir) {
          config.outputDirectories.push({
            name: "Current directory",
            path: ".",
            description: "Generate in the current directory",
          });
        }

        return config;
      } else {
        await this.createDefaultConfig();
        return this.defaultConfig;
      }
    } catch (error) {
      console.warn("⚠️  Error reading template.config.js:", error instanceof Error ? error.message : "Unknown error");
      console.warn("Using default configuration.");
      return this.defaultConfig;
    }
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfig(): Promise<void> {
    try {
      const defaultFullConfig = this.getDefaultFullConfig();
      const configContent = await this.generateConfigContent(defaultFullConfig);

      await FileUtils.ensureDir(path.dirname(this.configFile));
      await writeFile(this.configFile, configContent);

      const isESM = await this.isESModule();
      console.log("📄 Created default template.config.js");
      console.log(`   Format: ${isESM ? "ES Module (export default)" : "CommonJS (module.exports)"}`);
      console.log("   You can customize the output directories in this file.");
    } catch (error) {
      console.warn("⚠️  Could not create default template.config.js:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Update configuration by allowing user to modify directories
   */
  async updateConfig(): Promise<void> {
    try {
      const currentConfig = await this.loadConfig();

      console.log("📝 Current output directories:");
      currentConfig.outputDirectories.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.name} → ${dir.path}${dir.description ? ` (${dir.description})` : ""}`);
      });

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "Add a new output directory", value: "add" },
            { name: "Edit an existing directory", value: "edit" },
            { name: "Remove a directory", value: "remove" },
            { name: "Reset to default configuration", value: "reset" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      switch (action) {
        case "add":
          await this.addOutputDirectory(currentConfig);
          break;
        case "edit":
          await this.editOutputDirectory(currentConfig);
          break;
        case "remove":
          await this.removeOutputDirectory(currentConfig);
          break;
        case "reset":
          await this.resetToDefaultConfig();
          break;
        case "cancel":
          console.log("🚫 Update cancelled.");
          return;
      }
    } catch (error) {
      console.error("⚠️  Error updating configuration:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Add a new output directory to configuration
   * @param config - Current configuration to modify
   * @private
   */
  private async addOutputDirectory(config: TemplateConfig): Promise<void> {
    const { name, path, description } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter directory name:",
        validate: this.validateNonEmpty,
      },
      {
        type: "input",
        name: "path",
        message: "Enter directory path:",
        validate: this.validateNonEmpty,
      },
      {
        type: "input",
        name: "description",
        message: "Enter description (optional):",
      },
    ]);

    const newDir: OutputDirectory = {
      name: name.trim(),
      path: path.trim(),
      description: description.trim() || undefined,
    };
    
    // Validate the new directory
    Validators.validateOutputDirectory(newDir);
    
    config.outputDirectories.push(newDir);

    await this.saveConfig(config);
    console.log(`✅ Added new output directory: ${name} → ${path}`);
  }

  /**
   * Edit an existing output directory
   * @param config - Current configuration to modify
   * @private
   */
  private async editOutputDirectory(config: TemplateConfig): Promise<void> {
    if (config.outputDirectories.length === 0) {
      console.log("❌ No directories to edit.");
      return;
    }

    const { selectedIndex } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedIndex",
        message: "Select directory to edit:",
        choices: config.outputDirectories.map((dir, index) => ({
          name: `${dir.name} → ${dir.path}`,
          value: index,
        })),
      },
    ]);

    const selectedDir = config.outputDirectories[selectedIndex];
    const { name, path, description } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter directory name:",
        default: selectedDir.name,
        validate: this.validateNonEmpty,
      },
      {
        type: "input",
        name: "path",
        message: "Enter directory path:",
        default: selectedDir.path,
        validate: this.validateNonEmpty,
      },
      {
        type: "input",
        name: "description",
        message: "Enter description (optional):",
        default: selectedDir.description || "",
      },
    ]);

    const updatedDir: OutputDirectory = {
      name: name.trim(),
      path: path.trim(),
      description: description.trim() || undefined,
    };
    
    // Validate the updated directory
    Validators.validateOutputDirectory(updatedDir);
    
    config.outputDirectories[selectedIndex] = updatedDir;

    await this.saveConfig(config);
    console.log(`✅ Updated directory: ${name} → ${path}`);
  }

  /**
   * Remove an output directory from configuration
   * @param config - Current configuration to modify
   * @private
   */
  private async removeOutputDirectory(config: TemplateConfig): Promise<void> {
    if (config.outputDirectories.length === 0) {
      console.log("❌ No directories to remove.");
      return;
    }

    const { selectedIndex } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedIndex",
        message: "Select directory to remove:",
        choices: config.outputDirectories.map((dir, index) => ({
          name: `${dir.name} → ${dir.path}`,
          value: index,
        })),
      },
    ]);

    const removedDir = config.outputDirectories[selectedIndex];
    config.outputDirectories.splice(selectedIndex, 1);

    await this.saveConfig(config);
    console.log(`✅ Removed directory: ${removedDir.name} → ${removedDir.path}`);
  }

  /**
   * Reset configuration to default values
   * @private
   */
  private async resetToDefaultConfig(): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to reset to default configuration?",
        default: false,
      },
    ]);

    if (confirm) {
      await this.createDefaultConfig();
      console.log("✅ Configuration reset to default values.");
    } else {
      console.log("🚫 Reset cancelled.");
    }
  }

  /**
   * Save configuration to file
   * @param config - Configuration to save
   * @private
   */
  private async saveConfig(config: TemplateConfig): Promise<void> {
    try {
      const configContent = await this.generateConfigContent(config);
      await writeFile(this.configFile, configContent);
    } catch (error) {
      console.error("⚠️  Error saving configuration:", error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }
}
