import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { TemplateManager } from "./template-manager";
import { generateTemplateVariables, replaceTemplateVariables } from "./utils";

const TEST_TEMPLATES_DIR = "./test-templates";
const TEST_OUTPUT_DIR = "./test-output";

describe("TemplateManager", () => {
  let templateManager: TemplateManager;

  beforeEach(async () => {
    // Ensure clean state before each test
    await cleanupTestDirectories();

    templateManager = new TemplateManager(TEST_TEMPLATES_DIR);

    await mkdir(TEST_TEMPLATES_DIR, { recursive: true });
    await mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestDirectories();
  });

  // Helper function to ensure consistent cleanup
  async function cleanupTestDirectories() {
    try {
      await rm(TEST_TEMPLATES_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    try {
      await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  describe("Template variable generation and replacement", () => {
    test("should generate and replace template variables correctly", () => {
      const testName = "TestComponent";
      const variables = generateTemplateVariables(testName);

      assert.strictEqual(variables.templateNameToPascalCase, "TestComponent");
      assert.strictEqual(variables.templateNameToCamelCase, "testComponent");
      assert.strictEqual(variables.templateNameToDashCase, "test-component");
    });

    test("should replace template variables in content", () => {
      const variables = generateTemplateVariables("test component");

      const content = "class __templateNameToPascalCase__ {}";
      const result = replaceTemplateVariables(content, variables);

      assert.strictEqual(result, "class TestComponent {}");
    });

    test("should handle multiple template variables in content", () => {
      const variables = generateTemplateVariables("my button");

      const content = `
        export const __templateNameToPascalCase__ = () => {
          const className = '__templateNameToDashCase__';
          const instance = __templateNameToCamelCase__;
        };
      `;

      const result = replaceTemplateVariables(content, variables);

      assert(result.includes("export const MyButton"));
      assert(result.includes("const className = 'my-button'"));
      assert(result.includes("const instance = myButton"));
    });
  });

  describe("TemplateManager instantiation", () => {
    test("should create TemplateManager with default templates directory", () => {
      const manager = new TemplateManager();
      assert(manager instanceof TemplateManager);
    });

    test("should create TemplateManager with custom templates directory", () => {
      const manager = new TemplateManager("./custom-templates");
      assert(manager instanceof TemplateManager);
    });
  });

  describe("Template processing logic", () => {
    test("should handle different naming conventions", () => {
      const testCases = [
        { input: "my-component", expected: "MyComponent" },
        { input: "MyComponent", expected: "MyComponent" },
        { input: "my_component", expected: "MyComponent" },
        { input: "my awesome component", expected: "MyAwesomeComponent" },
      ];

      for (const testCase of testCases) {
        const variables = generateTemplateVariables(testCase.input);
        assert.strictEqual(variables.templateNameToPascalCase, testCase.expected);
      }
    });

    test("should preserve content without template variables", () => {
      const variables = generateTemplateVariables("test");

      const content = "This is regular content without variables";
      const result = replaceTemplateVariables(content, variables);

      assert.strictEqual(result, content);
    });
  });

  describe("listTemplates", () => {
    test("should return empty array when no templates exist", async () => {
      const templates = await templateManager.listTemplates();
      assert(Array.isArray(templates));
      assert.strictEqual(templates.length, 0);
    });

    test("should list file templates", async () => {
      // Create a template file (directory already exists from beforeEach)
      await writeFile(`${TEST_TEMPLATES_DIR}/test-template.tsx`, "test content");

      const templates = await templateManager.listTemplates();

      assert.strictEqual(templates.length, 1);
      assert.strictEqual(templates[0].name, "test-template.tsx");
      assert.strictEqual(templates[0].type, "file");
    });

    test("should list directory templates", async () => {
      await mkdir(`${TEST_TEMPLATES_DIR}/component-template`, { recursive: true });
      await writeFile(`${TEST_TEMPLATES_DIR}/component-template/index.tsx`, "test content");

      const templates = await templateManager.listTemplates();

      assert.strictEqual(templates.length, 1);
      assert.strictEqual(templates[0].name, "component-template");
      assert.strictEqual(templates[0].type, "directory");
    });
  });

  describe("generateFromTemplate", () => {
    test("should generate from file template", async () => {
      const templateContent = `export const __templateNameToPascalCase__ = () => {
  return <div>Hello __templateNameToPascalCase__</div>;
};`;

      await writeFile(`${TEST_TEMPLATES_DIR}/component.tsx`, templateContent);

      await templateManager.generateFromTemplate("component.tsx", "MyComponent", TEST_OUTPUT_DIR);

      const templates = await templateManager.listTemplates();
      assert(templates.length > 0);
    });

    test("should throw error for non-existent template", async () => {
      try {
        await templateManager.generateFromTemplate("non-existent", "Test", TEST_OUTPUT_DIR);
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error instanceof Error);
        assert(error.message.includes("not found"));
      }
    });

    test("should handle directory template generation", async () => {
      await mkdir(`${TEST_TEMPLATES_DIR}/component-dir`, { recursive: true });
      await writeFile(
        `${TEST_TEMPLATES_DIR}/component-dir/__templateNameToPascalCase__.tsx`,
        `export const __templateNameToPascalCase__ = () => <div>__templateNameToPascalCase__</div>;`
      );

      await templateManager.generateFromTemplate("component-dir", "TestComponent", TEST_OUTPUT_DIR);

      const templates = await templateManager.listTemplates();
      assert(templates.length > 0);
    });
  });

  describe("error handling", () => {
    test("should handle missing templates directory gracefully", async () => {
      const nonExistentManager = new TemplateManager("./non-existent-templates");
      const templates = await nonExistentManager.listTemplates();

      assert(Array.isArray(templates));
      assert.strictEqual(templates.length, 0);
    });
  });
});
