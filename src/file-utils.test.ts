import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { writeFile, unlink, mkdir, rm } from "node:fs/promises";
import { FileUtils } from "./file-utils";

const TEST_DIR = "./test-file-utils";
const TEST_FILE = "./test-file.txt";

describe("FileUtils", () => {
  afterEach(async () => {
    try {
      await unlink(TEST_FILE);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    try {
      await rm(TEST_DIR, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe("pathExists", () => {
    test("should return true for existing file", async () => {
      await writeFile(TEST_FILE, "test content");
      const exists = await FileUtils.pathExists(TEST_FILE);
      assert.strictEqual(exists, true);
    });

    test("should return false for non-existing file", async () => {
      const exists = await FileUtils.pathExists("./non-existing-file.txt");
      assert.strictEqual(exists, false);
    });
  });

  describe("ensureDir", () => {
    test("should create directory if it doesn't exist", async () => {
      await FileUtils.ensureDir(TEST_DIR);
      const exists = await FileUtils.pathExists(TEST_DIR);
      assert.strictEqual(exists, true);
    });

    test("should not fail if directory already exists", async () => {
      await mkdir(TEST_DIR);
      await FileUtils.ensureDir(TEST_DIR);
      const exists = await FileUtils.pathExists(TEST_DIR);
      assert.strictEqual(exists, true);
    });
  });

  describe("copy", () => {
    test("should copy file successfully", async () => {
      const sourceFile = "./source-test.txt";
      const destFile = "./dest-test.txt";

      await writeFile(sourceFile, "test content");
      await FileUtils.copy(sourceFile, destFile);

      const destExists = await FileUtils.pathExists(destFile);
      assert.strictEqual(destExists, true);

      await unlink(sourceFile);
      await unlink(destFile);
    });
  });
});
