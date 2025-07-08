#!/usr/bin/env node

import * as path from "path";
import { FileUtils } from "./file-utils";

/**
 * Install default templates from the package to the current project
 * Creates a .template directory and copies bundled templates
 */
async function installTemplates() {
  try {
    const targetProjectDir = process.cwd();
    const sourceTemplatesDir = path.join(__dirname, "../templates");
    const targetTemplatesDir = path.join(targetProjectDir, ".template");

    console.log("📦 Installing comp-template templates...");

    if (!(await FileUtils.pathExists(sourceTemplatesDir))) {
      console.log("⚠️  No templates found in package. Skipping installation.");
      return;
    }

    if (await FileUtils.pathExists(targetTemplatesDir)) {
      console.log("✅ Templates directory already exists. Existing templates preserved.");
      return;
    }

    await FileUtils.copy(sourceTemplatesDir, targetTemplatesDir, { overwrite: false });

    console.log("✅ Templates installed in .template/");
    console.log("   Usage: npx template");
    console.log("   Add custom templates to .template/ directory");
  } catch (error) {
    console.error("❌ Error installing templates:", error instanceof Error ? error.message : "Unknown error");
    process.exit(0);
  }
}

if (require.main === module) {
  installTemplates();
}

export { installTemplates };
