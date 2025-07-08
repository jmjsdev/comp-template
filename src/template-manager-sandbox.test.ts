import { describe, test } from "node:test";
import assert from "node:assert";
import { TemplateManager } from "./template-manager";

describe("TemplateManager Basic Tests", () => {
  test("should create TemplateManager instance", () => {
    const templateManager = new TemplateManager();
    assert(templateManager instanceof TemplateManager);
  });

  test("should have listTemplates method", () => {
    const templateManager = new TemplateManager();
    assert(typeof templateManager.listTemplates === "function");
  });

  test("should have generateFromTemplate method", () => {
    const templateManager = new TemplateManager();
    assert(typeof templateManager.generateFromTemplate === "function");
  });
});