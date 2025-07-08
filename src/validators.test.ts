import { describe, it } from "node:test";
import assert from "node:assert";
import { Validators } from "./validators";

describe("Validators", () => {
  describe("validatePath", () => {
    it("should accept valid paths", () => {
      assert.doesNotThrow(() => Validators.validatePath("templates/component"));
      assert.doesNotThrow(() => Validators.validatePath("src/components"));
      assert.doesNotThrow(() => Validators.validatePath("test-folder/sub-folder"));
    });

    it("should reject paths with directory traversal", () => {
      assert.throws(() => Validators.validatePath("../../../etc/passwd"), /directory traversal/);
      assert.throws(() => Validators.validatePath("..\\..\\windows\\system32"), /directory traversal/);
      assert.throws(() => Validators.validatePath("templates/../../../secret"), /directory traversal/);
    });

    it("should reject absolute paths", () => {
      assert.throws(() => Validators.validatePath("/etc/passwd"), /directory traversal/);
      assert.throws(() => Validators.validatePath("/usr/bin"), /directory traversal/);
    });

    it("should reject home directory paths", () => {
      assert.throws(() => Validators.validatePath("~/Documents"), /directory traversal/);
      assert.throws(() => Validators.validatePath("~/.ssh/config"), /directory traversal/);
    });

    it("should reject paths with null bytes", () => {
      assert.throws(() => Validators.validatePath("file\0name"), /null bytes/);
      assert.throws(() => Validators.validatePath("path/to/\0/file"), /null bytes/);
    });
  });

  describe("validateTemplateName", () => {
    it("should accept valid names", () => {
      assert.strictEqual(Validators.validateTemplateName("MyComponent"), "MyComponent");
      assert.strictEqual(Validators.validateTemplateName("user-profile"), "user-profile");
      assert.strictEqual(Validators.validateTemplateName("test_component_123"), "test_component_123");
      assert.strictEqual(Validators.validateTemplateName("Header Section"), "Header Section");
    });

    it("should trim whitespace", () => {
      assert.strictEqual(Validators.validateTemplateName("  MyComponent  "), "MyComponent");
      assert.strictEqual(Validators.validateTemplateName("\tTabbed Name\n"), "Tabbed Name");
    });

    it("should reject empty names", () => {
      assert.throws(() => Validators.validateTemplateName(""), /empty/);
      assert.throws(() => Validators.validateTemplateName("   "), /empty/);
      assert.throws(() => Validators.validateTemplateName("\t\n"), /empty/);
    });

    it("should reject names that are too long", () => {
      const longName = "a".repeat(101);
      assert.throws(() => Validators.validateTemplateName(longName), /exceed 100 characters/);
    });

    it("should reject names with invalid characters", () => {
      assert.throws(() => Validators.validateTemplateName("My@Component"), /can only contain/);
      assert.throws(() => Validators.validateTemplateName("user#profile"), /can only contain/);
      assert.throws(() => Validators.validateTemplateName("test!component"), /can only contain/);
      assert.throws(() => Validators.validateTemplateName("../../etc/passwd"), /can only contain/);
    });

    it("should reject reserved system names", () => {
      assert.throws(() => Validators.validateTemplateName("CON"), /reserved system name/);
      assert.throws(() => Validators.validateTemplateName("prn"), /reserved system name/);
      assert.throws(() => Validators.validateTemplateName("AUX"), /reserved system name/);
      assert.throws(() => Validators.validateTemplateName("nul"), /reserved system name/);
      assert.throws(() => Validators.validateTemplateName("COM1"), /reserved system name/);
      assert.throws(() => Validators.validateTemplateName("LPT1"), /reserved system name/);
    });
  });

  describe("isPathWithinDirectory", () => {
    it("should return true for paths within directory", () => {
      assert.strictEqual(Validators.isPathWithinDirectory("src/components/Button.tsx", "src"), true);
      assert.strictEqual(Validators.isPathWithinDirectory("./templates/component", "."), true);
    });

    it("should return false for paths outside directory", () => {
      assert.strictEqual(Validators.isPathWithinDirectory("../outside", "src"), false);
      assert.strictEqual(Validators.isPathWithinDirectory("/etc/passwd", "src"), false);
    });
  });

  describe("validateOutputDirectory", () => {
    it("should accept valid output directory configs", () => {
      assert.doesNotThrow(() => Validators.validateOutputDirectory({
        name: "Components",
        path: "src/components",
        description: "React components"
      }));
      
      assert.doesNotThrow(() => Validators.validateOutputDirectory({
        name: "Utils",
        path: "src/utils"
      }));
    });

    it("should reject invalid configurations", () => {
      assert.throws(() => Validators.validateOutputDirectory({
        name: "",
        path: "src/components"
      }), /must have a valid name/);
      
      assert.throws(() => Validators.validateOutputDirectory({
        name: "Components",
        path: ""
      }), /must have a valid path/);
      
      assert.throws(() => Validators.validateOutputDirectory({
        name: "Components",
        path: "../../../etc"
      }), /directory traversal/);
    });
  });

  describe("sanitizeFileContent", () => {
    it("should remove script tags", () => {
      const content = 'Hello <script>alert("xss")</script> World';
      assert.strictEqual(Validators.sanitizeFileContent(content), "Hello  World");
    });

    it("should remove multiple script tags", () => {
      const content = '<script>bad1</script>Text<script>bad2</script>';
      assert.strictEqual(Validators.sanitizeFileContent(content), "Text");
    });

    it("should leave normal content unchanged", () => {
      const content = "export const MyComponent = () => <div>Hello</div>";
      assert.strictEqual(Validators.sanitizeFileContent(content), content);
    });
  });
});