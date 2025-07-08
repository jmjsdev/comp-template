import path from "path";

/**
 * Security validators and sanitizers for user input
 */
export class Validators {
  /**
   * Validate that a path doesn't contain directory traversal attempts
   * @param inputPath - The path to validate
   * @throws Error if path contains traversal attempts
   */
  static validatePath(inputPath: string): void {
    const normalizedPath = path.normalize(inputPath);
    
    // Check for path traversal attempts
    if (normalizedPath.includes("..") || normalizedPath.startsWith("/") || normalizedPath.startsWith("~")) {
      throw new Error(`Invalid path: "${inputPath}" contains directory traversal characters`);
    }
    
    // Check for null bytes
    if (inputPath.includes("\0")) {
      throw new Error(`Invalid path: "${inputPath}" contains null bytes`);
    }
  }

  /**
   * Validate and sanitize a template/component name
   * @param name - The name to validate
   * @returns Sanitized name
   * @throws Error if name is invalid
   */
  static validateTemplateName(name: string): string {
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      throw new Error("Name cannot be empty");
    }
    
    if (trimmedName.length > 100) {
      throw new Error("Name cannot exceed 100 characters");
    }
    
    // Only allow alphanumeric, spaces, hyphens, and underscores
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(trimmedName)) {
      throw new Error("Name can only contain letters, numbers, spaces, hyphens, and underscores");
    }
    
    // Prevent reserved names
    const reservedNames = ["con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"];
    if (reservedNames.includes(trimmedName.toLowerCase())) {
      throw new Error(`"${trimmedName}" is a reserved system name`);
    }
    
    return trimmedName;
  }

  /**
   * Check if a file path is within an allowed directory
   * @param filePath - The file path to check
   * @param allowedDir - The allowed directory
   * @returns True if path is safe
   */
  static isPathWithinDirectory(filePath: string, allowedDir: string): boolean {
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir);
    return resolvedPath.startsWith(resolvedAllowedDir);
  }

  /**
   * Validate output directory configuration
   * @param outputDir - The output directory object to validate
   * @throws Error if configuration is invalid
   */
  static validateOutputDirectory(outputDir: { name: string; path: string; description?: string }): void {
    if (!outputDir.name || typeof outputDir.name !== "string") {
      throw new Error("Output directory must have a valid name");
    }
    
    if (!outputDir.path || typeof outputDir.path !== "string") {
      throw new Error("Output directory must have a valid path");
    }
    
    // Validate the path
    this.validatePath(outputDir.path);
    
    if (outputDir.description && typeof outputDir.description !== "string") {
      throw new Error("Output directory description must be a string");
    }
  }

  /**
   * Sanitize file content to prevent injection attacks
   * @param content - The content to sanitize
   * @returns Sanitized content
   */
  static sanitizeFileContent(content: string): string {
    // Remove any potential script tags or executable content
    // This is a basic implementation - extend based on needs
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
}