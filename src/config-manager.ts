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

    // Extract transformName function if it exists
    const { transformName, ...configWithoutFunction } = config;
    const configJson = JSON.stringify(configWithoutFunction, null, 2);

    // Default transformName function as string
    const defaultTransformName = `function transformName(name, variables) {
  // Default behavior: preserve the input name as-is for directory templates
  // You can customize this function to change how directory names are generated
  // Available variables: templateNameToPascalCase, templateNameToCamelCase, templateNameToDashCase, etc.
  // Examples:
  //   return variables.templateNameToPascalCase;  // "my-comp" -> "MyComp"
  //   return variables.templateNameToCamelCase;   // "my-comp" -> "myComp"
  //   return variables.templateNameToDashCase;    // "my comp" -> "my-comp"
  return name;
}`;

    if (isESM) {
      return `${defaultTransformName}

const config = ${configJson};
config.transformName = transformName;

export default config;`;
    } else {
      return `${defaultTransformName}

const config = ${configJson};
config.transformName = transformName;

module.exports = config;`;
    }
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
    const configContent = await readFile(absolutePath, 'utf8');
    
    // Try to detect the format of the config file itself
    const isConfigESM = configContent.includes('export default') || configContent.includes('export {');
    const isConfigCJS = configContent.includes('module.exports') || configContent.includes('exports.');
    
    if (isConfigESM) {
      // For ES module format config files, we need to use a workaround
      // since direct import() might not work for .js files in CommonJS environment
      return this.loadESModuleConfig(configContent, absolutePath);
    } else if (isConfigCJS) {
      // For CommonJS format config files
      return this.loadCommonJSConfig(configContent, absolutePath);
    } else {
      // Fallback: try both methods
      try {
        // Try ES module first
        return this.loadESModuleConfig(configContent, absolutePath);
      } catch {
        // Fallback to CommonJS evaluation
        return this.loadCommonJSConfig(configContent, absolutePath);
      }
    }
  }

  /**
   * Load ES module format configuration
   * @param configContent - File content
   * @param absolutePath - Absolute path to config file
   * @private
   */
  private async loadESModuleConfig(configContent: string, absolutePath: string): Promise<TemplateConfig> {
    try {
      // First try direct import for proper ES modules
      const configModule = await import(`file://${absolutePath}?t=${Date.now()}`);
      return configModule.default || configModule;
    } catch (importError) {
      // If direct import fails, try to evaluate the ES module manually
      // This is necessary when the file uses ES syntax but isn't properly configured as ESM
      try {
        // Create a temporary module with ES module simulation
        const moduleContext = {
          exports: {},
          module: { exports: {} },
          __dirname: path.dirname(absolutePath),
          __filename: absolutePath,
          require: require,
          console: console
        };

        // Transform export default syntax to make it work in CommonJS context
        let transformedContent = configContent;
        
        // Handle "export default" by converting it to module.exports
        if (transformedContent.includes('export default')) {
          transformedContent = transformedContent.replace(
            /export\s+default\s+/g, 
            'module.exports = '
          );
        }
        
        // Create and execute the function
        const evalFunc = new Function(
          'module', 'exports', '__dirname', '__filename', 'require', 'console',
          transformedContent
        );
        evalFunc(
          moduleContext.module, 
          moduleContext.exports, 
          moduleContext.__dirname, 
          moduleContext.__filename,
          moduleContext.require,
          moduleContext.console
        );
        
        return moduleContext.module.exports as TemplateConfig;
      } catch (evalError) {
        throw new Error(`Failed to load ES module config: ${evalError instanceof Error ? evalError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Load CommonJS format configuration
   * @param configContent - File content
   * @param absolutePath - Absolute path to config file
   * @private
   */
  private loadCommonJSConfig(configContent: string, absolutePath: string): TemplateConfig {
    const module = { exports: {} };
    const exports = module.exports;
    
    // Create a function to evaluate the CommonJS module
    const evalFunc = new Function('module', 'exports', '__dirname', '__filename', 'require', 'console', configContent);
    evalFunc(module, exports, path.dirname(absolutePath), absolutePath, require, console);
    
    return module.exports as TemplateConfig;
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
