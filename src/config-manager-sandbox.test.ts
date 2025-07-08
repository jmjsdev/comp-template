import { describe, test } from "node:test";
import assert from "node:assert";
import { ConfigManager } from "./config-manager";

describe("ConfigManager Basic Tests", () => {
  test("should create ConfigManager instance", () => {
    const configManager = new ConfigManager("template.config.js");
    assert(configManager instanceof ConfigManager);
  });

  test("should create ConfigManager with custom config file", () => {
    const configManager = new ConfigManager("custom.config.js");
    assert(configManager instanceof ConfigManager);
  });
});