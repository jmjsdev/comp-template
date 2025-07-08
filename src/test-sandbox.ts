import { fs, vol } from "memfs";
// @ts-ignore - fs-monkey doesn't have TypeScript definitions
import { patchFs } from "fs-monkey";
import * as realFs from "fs";
import * as fsPromises from "fs/promises";

/**
 * Test Sandbox System for isolated filesystem testing
 * Uses memfs to create an in-memory filesystem that doesn't affect real files
 */
export class TestSandbox {
  private static originalFs: typeof realFs;
  private static originalFsPromises: typeof fsPromises;
  private static isPatched = false;

  /**
   * Initialize the sandbox - replaces real filesystem with memfs
   */
  static init() {
    if (TestSandbox.isPatched) return;

    // Store original filesystem
    TestSandbox.originalFs = { ...realFs };
    TestSandbox.originalFsPromises = { ...fsPromises };

    // Patch filesystem with memfs
    patchFs(vol);
    
    // Also patch fs/promises to use memfs
    const memfsPromises = fs.promises;
    Object.assign(fsPromises, memfsPromises);
    
    TestSandbox.isPatched = true;
  }

  /**
   * Reset the sandbox - clears all files and directories
   */
  static reset() {
    if (!TestSandbox.isPatched) return;
    vol.reset();
  }

  /**
   * Restore original filesystem
   */
  static restore() {
    if (!TestSandbox.isPatched) return;

    // For now, just mark as unpatched to avoid fs property conflicts
    // The memfs will be garbage collected and tests run in isolation
    TestSandbox.isPatched = false;
  }

  /**
   * Create a directory structure in the sandbox
   */
  static createDirectoryStructure(structure: Record<string, string | null>) {
    vol.fromJSON(structure);
  }

  /**
   * Create a typical project structure for testing
   */
  static createDefaultProjectStructure() {
    const structure = {
      // Templates directory
      ".template/react-component/__templateNameToPascalCase__.tsx": `import React from 'react';

interface __templateNameToPascalCase__Props {
  // Add your props here
}

export const __templateNameToPascalCase__: React.FC<__templateNameToPascalCase__Props> = () => {
  return (
    <div className="__templateNameToDashCase__">
      <h1>__templateNameToPascalCase__</h1>
    </div>
  );
};

export default __templateNameToPascalCase__;`,

      ".template/react-component/__templateNameToPascalCase__.test.tsx": `import { render, screen } from '@testing-library/react';
import { __templateNameToPascalCase__ } from './__templateNameToPascalCase__';

describe('__templateNameToPascalCase__', () => {
  it('renders correctly', () => {
    render(<__templateNameToPascalCase__ />);
    expect(screen.getByText('__templateNameToPascalCase__')).toBeInTheDocument();
  });
});`,

      ".template/react-component/__templateNameToDashCase__.css": `.__templateNameToDashCase__ {
  /* Add your styles here */
}`,

      ".template/react-hook/use__templateNameToPascalCase__.ts": `import { useState, useEffect } from 'react';

export const use__templateNameToPascalCase__ = () => {
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    // Add your effect logic here
  }, []);

  return {
    value,
    setValue,
  };
};`,

      ".template/angular-component/__templateNameToDashCase__.component.ts": `import { Component } from '@angular/core';

@Component({
  selector: 'app-__templateNameToDashCase__',
  templateUrl: './__templateNameToDashCase__.component.html',
  styleUrls: ['./__templateNameToDashCase__.component.css']
})
export class __templateNameToPascalCase__Component {
  constructor() { }
}`,

      ".template/angular-component/__templateNameToDashCase__.component.html": `<div class="__templateNameToDashCase__">
  <h2>__templateNameToPascalCase__ Component</h2>
</div>`,

      ".template/angular-component/__templateNameToDashCase__.component.css": `.__templateNameToDashCase__ {
  /* Add your styles here */
}`,

      // Config file
      "template.config.js": `module.exports = {
  outputDirectories: [
    { name: "Components", path: "./src/components", description: "React components" },
    { name: "Hooks", path: "./src/hooks", description: "Custom React hooks" },
    { name: "Utils", path: "./src/utils", description: "Utility functions" },
    { name: "Current Directory", path: ".", description: "Generate in current directory" }
  ]
};`,

      // Output directories
      "src/components/": null,
      "src/hooks/": null,
      "src/utils/": null,
      "dist/": null,
      "test/": null,
    };

    TestSandbox.createDirectoryStructure(structure);
  }

  /**
   * Create a minimal project structure for testing
   */
  static createMinimalProjectStructure() {
    const structure = {
      ".template/simple-component.tsx": `export const __templateNameToPascalCase__ = () => {
  return <div>__templateNameToPascalCase__</div>;
};`,
      "src/": null,
      "template.config.js": `module.exports = {
  outputDirectories: [
    { name: "Current Directory", path: ".", description: "Generate in current directory" }
  ]
};`,
    };

    TestSandbox.createDirectoryStructure(structure);
  }

  /**
   * Create a project structure with invalid templates for error testing
   */
  static createInvalidProjectStructure() {
    const structure = {
      ".template/invalid-template.tsx": `export const __templateNameInvalid__ = () => {
  return <div>__templateName</div>; // Incomplete placeholder
};`,
      ".template/empty-dir/": null,
      "src/": null,
    };

    TestSandbox.createDirectoryStructure(structure);
  }

  /**
   * Get the current filesystem state (for debugging)
   */
  static getFilesystemState(): Record<string, string> {
    return vol.toJSON() as Record<string, string>;
  }

  /**
   * Check if a file exists in the sandbox
   */
  static fileExists(path: string): boolean {
    try {
      vol.statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a file from the sandbox
   */
  static readFile(path: string): string {
    return vol.readFileSync(path, "utf8") as string;
  }

  /**
   * Write a file to the sandbox
   */
  static writeFile(path: string, content: string): void {
    vol.writeFileSync(path, content);
  }

  /**
   * Create a file in the sandbox
   */
  static createFile(path: string, content: string): void {
    // Ensure directory exists
    const dir = path.substring(0, path.lastIndexOf("/"));
    if (dir) {
      vol.mkdirSync(dir, { recursive: true });
    }
    vol.writeFileSync(path, content);
  }

  /**
   * List files in a directory
   */
  static listFiles(path: string): string[] {
    try {
      return vol.readdirSync(path) as string[];
    } catch {
      return [];
    }
  }
}

/**
 * Test helper functions for common sandbox operations
 */
export class SandboxHelpers {
  /**
   * Setup a test with default project structure
   */
  static setupTest() {
    TestSandbox.init();
    TestSandbox.reset();
    TestSandbox.createDefaultProjectStructure();
  }

  /**
   * Setup a minimal test environment
   */
  static setupMinimalTest() {
    TestSandbox.init();
    TestSandbox.reset();
    TestSandbox.createMinimalProjectStructure();
  }

  /**
   * Setup test with invalid templates for error testing
   */
  static setupInvalidTemplateTest() {
    TestSandbox.init();
    TestSandbox.reset();
    TestSandbox.createInvalidProjectStructure();
  }

  /**
   * Cleanup after test
   */
  static cleanup() {
    TestSandbox.reset();
    TestSandbox.restore();
  }
}

/**
 * Decorator for automatic sandbox setup/cleanup
 */
export function withSandbox(setupType: "default" | "minimal" | "invalid" = "default") {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Setup sandbox
        switch (setupType) {
          case "minimal":
            SandboxHelpers.setupMinimalTest();
            break;
          case "invalid":
            SandboxHelpers.setupInvalidTemplateTest();
            break;
          default:
            SandboxHelpers.setupTest();
        }

        // Run the test
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        // Cleanup
        SandboxHelpers.cleanup();
      }
    };

    return descriptor;
  };
}
