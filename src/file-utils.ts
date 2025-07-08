import * as fs from "fs/promises";
import * as path from "path";

/**
 * File utilities to replace fs-extra functionality with native Node.js fs/promises
 */
export class FileUtils {
  /**
   * Check if a path exists
   * @param filePath - The path to check
   * @returns Promise that resolves to true if path exists, false otherwise
   */
  static async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists, creating it recursively if needed
   * @param dirPath - The directory path to ensure exists
   * @returns Promise that resolves when directory is ensured
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Copy file or directory recursively
   * @param source - Source path to copy from
   * @param destination - Destination path to copy to
   * @param options - Copy options
   * @param options.overwrite - Whether to overwrite existing files (default: true)
   * @returns Promise that resolves when copy is complete
   */
  static async copy(source: string, destination: string, options: { overwrite?: boolean } = {}): Promise<void> {
    const stats = await fs.stat(source);

    if (stats.isDirectory()) {
      await this.copyDirectory(source, destination, options);
    } else {
      await this.copyFile(source, destination, options);
    }
  }

  /**
   * Copy a single file
   * @private
   * @param source - Source file path
   * @param destination - Destination file path
   * @param options - Copy options
   * @returns Promise that resolves when file is copied
   */
  private static async copyFile(source: string, destination: string, options: { overwrite?: boolean }): Promise<void> {
    if (!options.overwrite && (await this.pathExists(destination))) {
      return;
    }

    await this.ensureDir(path.dirname(destination));
    await fs.copyFile(source, destination);
  }

  /**
   * Copy directory recursively
   * @private
   * @param source - Source directory path
   * @param destination - Destination directory path
   * @param options - Copy options
   * @returns Promise that resolves when directory is copied
   */
  private static async copyDirectory(source: string, destination: string, options: { overwrite?: boolean }): Promise<void> {
    await this.ensureDir(destination);
    const items = await fs.readdir(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);
      const stats = await fs.stat(sourcePath);

      if (stats.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath, options);
      } else {
        await this.copyFile(sourcePath, destPath, options);
      }
    }
  }
}

/**
 * Re-exported fs.readdir for convenience
 */
export const readdir = fs.readdir;

/**
 * Re-exported fs.stat for convenience
 */
export const stat = fs.stat;

/**
 * Re-exported fs.readFile for convenience
 */
export const readFile = fs.readFile;

/**
 * Re-exported fs.writeFile for convenience
 */
export const writeFile = fs.writeFile;
