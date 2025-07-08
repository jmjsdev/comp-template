import path from "path";
import { readFile, readdir, stat } from "./file-utils";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
}

/**
 * Validates templates for common issues and best practices
 */
export class TemplateValidator {
  private static readonly VALID_PLACEHOLDERS = [
    "__templateNameToPascalCase__",
    "__templateNameToCamelCase__",
    "__templateNameToDashCase__",
    "__templateNameToSnakeCase__",
    "__templateNameToConstantCase__",
    "__templateNameToTitleCase__",
    "__templateNameToLowerCase__",
    "__templateNameToLowerCaseWithSpaces__"
  ];

  /**
   * Validate a template (file or directory)
   * @param templatePath - Path to the template
   * @returns Validation result with errors and warnings
   */
  static async validate(templatePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const stats = await stat(templatePath);
      
      if (stats.isDirectory()) {
        await this.validateDirectory(templatePath, result);
      } else {
        await this.validateFile(templatePath, result);
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Cannot access template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a directory template recursively
   * @param dirPath - Directory path
   * @param result - Validation result to update
   * @private
   */
  private static async validateDirectory(dirPath: string, result: ValidationResult): Promise<void> {
    const items = await readdir(dirPath);
    
    if (items.length === 0) {
      result.warnings.push(`Empty directory: ${dirPath}`);
    }

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await stat(itemPath);
      
      if (stats.isDirectory()) {
        await this.validateDirectory(itemPath, result);
      } else {
        await this.validateFile(itemPath, result);
      }
    }
  }

  /**
   * Validate a single template file
   * @param filePath - File path
   * @param result - Validation result to update
   * @private
   */
  private static async validateFile(filePath: string, result: ValidationResult): Promise<void> {
    const fileName = path.basename(filePath);
    
    // Check file name for placeholders
    this.validateFileName(fileName, result);
    
    // Skip validation for binary files
    if (this.isBinaryFile(fileName)) {
      result.warnings.push(`Binary file detected: ${fileName} - content validation skipped`);
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      this.validateFileContent(content, fileName, result);
    } catch (error) {
      result.warnings.push(`Cannot read file ${fileName}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Validate file name for correct placeholder usage
   * @param fileName - File name to validate
   * @param result - Validation result to update
   * @private
   */
  private static validateFileName(fileName: string, result: ValidationResult): void {
    // Check for partial placeholders
    const placeholderRegex = /__templateName[^_]*__/g;
    const matches = fileName.match(placeholderRegex) || [];
    
    for (const match of matches) {
      if (!this.VALID_PLACEHOLDERS.includes(match)) {
        result.errors.push(`Invalid placeholder in filename "${fileName}": ${match}`);
      }
    }
    
    // Check for incomplete placeholders
    if (fileName.includes("__templateName") && !placeholderRegex.test(fileName)) {
      result.errors.push(`Incomplete placeholder in filename: ${fileName}`);
    }
  }

  /**
   * Validate file content for correct placeholder usage
   * @param content - File content
   * @param fileName - File name for error messages
   * @param result - Validation result to update
   * @private
   */
  private static validateFileContent(content: string, fileName: string, result: ValidationResult): void {
    // Check for well-formed placeholders (start with __templateName and end with __)
    const placeholderRegex = /__templateName[^_\s]*__/g;
    const matches = content.match(placeholderRegex) || [];
    
    for (const match of matches) {
      if (!this.VALID_PLACEHOLDERS.includes(match)) {
        result.errors.push(`Invalid placeholder in ${fileName}: ${match}`);
      }
    }
    
    // Check for incomplete placeholders (start with __templateName but don't end with __)
    const incompleteRegex = /__templateName(?!.*__)/g;
    const incompleteMatches = content.match(incompleteRegex) || [];
    if (incompleteMatches.length > 0) {
      result.errors.push(`Incomplete placeholder in ${fileName}: ${incompleteMatches[0]}`);
    }
    
    // Check for mixed line endings
    const hasWindows = content.includes('\r\n');
    const hasUnixOnly = content.replace(/\r\n/g, '').includes('\n');
    if (hasWindows && hasUnixOnly) {
      result.warnings.push(`Mixed line endings in ${fileName}`);
    }
    
    // Check for very large files
    if (content.length > 1000000) { // 1MB
      result.warnings.push(`Large file (${(content.length / 1024 / 1024).toFixed(2)}MB): ${fileName}`);
    }
  }

  /**
   * Check if a file is likely binary based on extension
   * @param fileName - File name to check
   * @returns True if file is likely binary
   * @private
   */
  private static isBinaryFile(fileName: string): boolean {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.rar',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov',
      '.ttf', '.otf', '.woff', '.woff2'
    ];
    
    const ext = path.extname(fileName).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Validate all templates in a directory
   * @param templatesDir - Templates directory path
   * @returns Map of template names to validation results
   */
  static async validateAll(templatesDir: string): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    try {
      const templates = await readdir(templatesDir);
      
      for (const template of templates) {
        const templatePath = path.join(templatesDir, template);
        const result = await this.validate(templatePath);
        results.set(template, result);
      }
    } catch (error) {
      const errorResult: ValidationResult = {
        valid: false,
        errors: [`Cannot read templates directory: ${error instanceof Error ? error.message : "Unknown error"}`],
        warnings: []
      };
      results.set(templatesDir, errorResult);
    }
    
    return results;
  }
}