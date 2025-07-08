import path from "path";
import { Template, TemplateVariables } from "./types";
import { generateTemplateVariables, replaceTemplateVariables } from "./utils";
import { FileUtils, readdir, stat, readFile, writeFile } from "./file-utils";
import { Validators } from "./validators";
import { ProgressIndicator } from "./progress";

/**
 * Manages template operations including listing, loading, and generating from templates
 */
export interface GenerationResult {
  path: string;
  action: "create" | "overwrite" | "skip";
}

export class TemplateManager {
  private templatesDir: string;
  private generatedFiles: GenerationResult[] = [];
  private progress: ProgressIndicator | null = null;

  /**
   * Create a new TemplateManager instance
   * @param templatesDir - Directory containing templates (default: ".template")
   */
  constructor(templatesDir: string = ".template") {
    this.templatesDir = templatesDir;
  }

  /**
   * List all available templates in the templates directory
   * @returns Promise resolving to array of template information
   */
  async listTemplates(): Promise<Template[]> {
    const templates: Template[] = [];

    // Check if templates directory exists
    if (!(await FileUtils.pathExists(this.templatesDir))) {
      return templates; // Return empty array if directory doesn't exist
    }

    try {
      const items = await readdir(this.templatesDir);

      for (const item of items) {
        const itemPath = path.join(this.templatesDir, item);
        const stats = await stat(itemPath);
        templates.push({
          name: item,
          path: itemPath,
          type: stats.isDirectory() ? "directory" : "file",
        });
      }
    } catch (error) {
      // Return empty array if we can't read the directory
      return templates;
    }

    return templates;
  }

  /**
   * Generate files from a template
   * @param templateName - Name of the template to use
   * @param targetName - Name for the generated component/file
   * @param targetDir - Directory where files should be generated (default: ".")
   * @param options - Generation options
   */
  async generateFromTemplate(
    templateName: string, 
    targetName: string, 
    targetDir: string = ".",
    options: { dryRun?: boolean } = {}
  ): Promise<void> {
    // Validate template name to prevent path traversal
    Validators.validatePath(templateName);
    
    const templatePath = path.join(this.templatesDir, templateName);
    
    // Ensure template path is within templates directory
    if (!Validators.isPathWithinDirectory(templatePath, this.templatesDir)) {
      throw new Error(`Invalid template path: "${templateName}"`);
    }
    
    const variables = generateTemplateVariables(targetName);

    if (!(await FileUtils.pathExists(templatePath))) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Reset generated files list
    this.generatedFiles = [];

    // Count total files to process for progress indicator
    if (!options.dryRun) {
      const totalFiles = await this.countFiles(templatePath);
      this.progress = new ProgressIndicator(totalFiles);
      this.progress.start(totalFiles, `🚀 Generating from template "${templateName}"...`);
    }

    const stats = await stat(templatePath);
    if (stats.isDirectory()) {
      // Pour les templates de type directory, créer un dossier avec le nom du composant
      const componentDir = path.join(targetDir, variables.templateNameToPascalCase);
      if (!options.dryRun) {
        await FileUtils.ensureDir(componentDir);
      }
      await this.processDirectory(templatePath, componentDir, variables, options);
    } else {
      await this.processFile(templatePath, targetDir, variables, undefined, options);
    }
    
    // Return the list of files that were/would be generated
    if (options.dryRun) {
      console.log("\n🔍 Dry-run mode - Files that would be generated:");
      this.generatedFiles.forEach(file => {
        const actionSymbol = file.action === "create" ? "✨" : file.action === "overwrite" ? "🔄" : "⏭️";
        console.log(`   ${actionSymbol} ${file.path} (${file.action})`);
      });
      console.log(`\n   Total: ${this.generatedFiles.length} files\n`);
    } else if (this.progress) {
      this.progress.complete(`Generated ${this.generatedFiles.length} files successfully`);
    }
  }

  /**
   * Process a directory recursively, applying template variables
   * @param sourcePath - Source directory path
   * @param targetDir - Target directory path
   * @param variables - Template variables to apply
   * @private
   */
  private async processDirectory(
    sourcePath: string,
    targetDir: string,
    variables: TemplateVariables,
    options: { dryRun?: boolean } = {}
  ): Promise<void> {
    const items = await readdir(sourcePath);

    for (const item of items) {
      const sourceItemPath = path.join(sourcePath, item);
      const targetItemName = replaceTemplateVariables(item, variables);
      const targetItemPath = path.join(targetDir, targetItemName);

      const stats = await stat(sourceItemPath);
      if (stats.isDirectory()) {
        if (!options.dryRun) {
          await FileUtils.ensureDir(targetItemPath);
        }
        await this.processDirectory(sourceItemPath, targetItemPath, variables, options);
      } else {
        await this.processFile(sourceItemPath, targetDir, variables, targetItemName, options);
      }
    }
  }

  /**
   * Process a single file, applying template variables
   * @param sourcePath - Source file path
   * @param targetDir - Target directory path
   * @param variables - Template variables to apply
   * @param targetFileName - Optional target filename (if different from source)
   * @private
   */
  private async processFile(
    sourcePath: string,
    targetDir: string,
    variables: TemplateVariables,
    targetFileName?: string,
    options: { dryRun?: boolean } = {}
  ): Promise<void> {
    const content = await readFile(sourcePath, "utf-8");
    const processedContent = replaceTemplateVariables(content, variables);

    const fileName = targetFileName || replaceTemplateVariables(path.basename(sourcePath), variables);
    const targetPath = path.join(targetDir, fileName);

    // Check if file exists
    const fileExists = await FileUtils.pathExists(targetPath);
    const action: GenerationResult["action"] = fileExists ? "overwrite" : "create";
    
    this.generatedFiles.push({ path: targetPath, action });

    if (!options.dryRun) {
      await FileUtils.ensureDir(targetDir);
      await writeFile(targetPath, processedContent);
      
      if (this.progress) {
        this.progress.increment(fileName);
      }
    }
  }
  
  /**
   * Get the list of files that were generated in the last operation
   * @returns Array of generated file results
   */
  getGeneratedFiles(): GenerationResult[] {
    return [...this.generatedFiles];
  }
  
  /**
   * Count total number of files in a template recursively
   * @param templatePath - Path to the template
   * @returns Total number of files
   * @private
   */
  private async countFiles(templatePath: string): Promise<number> {
    const stats = await stat(templatePath);
    
    if (!stats.isDirectory()) {
      return 1;
    }
    
    let count = 0;
    const items = await readdir(templatePath);
    
    for (const item of items) {
      const itemPath = path.join(templatePath, item);
      const itemStats = await stat(itemPath);
      
      if (itemStats.isDirectory()) {
        count += await this.countFiles(itemPath);
      } else {
        count += 1;
      }
    }
    
    return count;
  }
}
