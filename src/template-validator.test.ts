import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { TemplateValidator } from "./template-validator";

const TEST_TEMPLATES_DIR = "./test-validator-templates";

describe("TemplateValidator", () => {
  beforeEach(async () => {
    await mkdir(TEST_TEMPLATES_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_TEMPLATES_DIR, { recursive: true, force: true });
  });

  describe("validate", () => {
    test("should validate a simple file template", async () => {
      const templateContent = "export const __templateNameToPascalCase__ = () => {};";
      await writeFile(`${TEST_TEMPLATES_DIR}/component.tsx`, templateContent);

      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/component.tsx`);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.warnings.length, 0);
    });

    test("should detect invalid placeholders", async () => {
      const templateContent = "export const __templateNameInvalid__ = () => {};";
      await writeFile(`${TEST_TEMPLATES_DIR}/invalid.tsx`, templateContent);

      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/invalid.tsx`);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("Invalid placeholder"));
    });

    test("should validate directory templates", async () => {
      const componentDir = `${TEST_TEMPLATES_DIR}/component-dir`;
      await mkdir(componentDir, { recursive: true });
      await writeFile(`${componentDir}/__templateNameToPascalCase__.tsx`, "export const Component = () => {};");
      await writeFile(`${componentDir}/__templateNameToPascalCase__.test.tsx`, "test content");

      const result = await TemplateValidator.validate(componentDir);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test("should warn about empty directories", async () => {
      const emptyDir = `${TEST_TEMPLATES_DIR}/empty-dir`;
      await mkdir(emptyDir, { recursive: true });

      const result = await TemplateValidator.validate(emptyDir);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.warnings.length, 1);
      assert(result.warnings[0].includes("Empty directory"));
    });

    test("should handle non-existent templates", async () => {
      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/non-existent`);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("Cannot access template"));
    });

    test("should detect incomplete placeholders", async () => {
      const templateContent = "export const __templateName = () => {};";
      await writeFile(`${TEST_TEMPLATES_DIR}/incomplete.tsx`, templateContent);

      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/incomplete.tsx`);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);
      assert(result.errors[0].includes("Incomplete placeholder"));
    });

    test("should warn about mixed line endings", async () => {
      const templateContent = "line1\r\nline2\nline3";
      await writeFile(`${TEST_TEMPLATES_DIR}/mixed-endings.txt`, templateContent);

      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/mixed-endings.txt`);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.warnings.length, 1);
      assert(result.warnings[0].includes("Mixed line endings"));
    });

    test("should handle binary files", async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      await writeFile(`${TEST_TEMPLATES_DIR}/image.png`, binaryContent);

      const result = await TemplateValidator.validate(`${TEST_TEMPLATES_DIR}/image.png`);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.warnings.length, 1);
      assert(result.warnings[0].includes("Binary file detected"));
    });
  });

  describe("validateAll", () => {
    test("should validate all templates in directory", async () => {
      await writeFile(`${TEST_TEMPLATES_DIR}/valid.tsx`, "const __templateNameToPascalCase__ = {};");
      await writeFile(`${TEST_TEMPLATES_DIR}/invalid.tsx`, "const __templateNameInvalid__ = {};");

      const results = await TemplateValidator.validateAll(TEST_TEMPLATES_DIR);

      assert.strictEqual(results.size, 2);
      assert.strictEqual(results.get("valid.tsx")?.valid, true);
      assert.strictEqual(results.get("invalid.tsx")?.valid, false);
    });

    test("should handle non-existent directory", async () => {
      const results = await TemplateValidator.validateAll("./non-existent-dir");

      assert.strictEqual(results.size, 1);
      const errorResult = results.get("./non-existent-dir");
      assert.strictEqual(errorResult?.valid, false);
      assert(errorResult?.errors[0].includes("Cannot read templates directory"));
    });
  });
});