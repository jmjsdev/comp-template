import { describe, test } from "node:test";
import assert from "node:assert";
import { StringCase, generateTemplateVariables, replaceTemplateVariables } from "./utils";

describe("StringCase transformations", () => {
  describe("toPascalCase", () => {
    test("should convert simple strings to PascalCase", () => {
      assert.strictEqual(StringCase.toPascalCase("hello world"), "HelloWorld");
      assert.strictEqual(StringCase.toPascalCase("my component"), "MyComponent");
      assert.strictEqual(StringCase.toPascalCase("test"), "Test");
    });

    test("should handle special characters and numbers", () => {
      assert.strictEqual(StringCase.toPascalCase("hello-world"), "HelloWorld");
      assert.strictEqual(StringCase.toPascalCase("hello_world"), "HelloWorld");
      assert.strictEqual(StringCase.toPascalCase("hello123world"), "Hello123world");
      assert.strictEqual(StringCase.toPascalCase("test-component-123"), "TestComponent123");
    });

    test("should handle camelCase input", () => {
      assert.strictEqual(StringCase.toPascalCase("myComponent"), "MyComponent");
      assert.strictEqual(StringCase.toPascalCase("testComponentName"), "TestComponentName");
    });

    test("should handle edge cases", () => {
      assert.strictEqual(StringCase.toPascalCase("a"), "A");
      assert.strictEqual(StringCase.toPascalCase("123"), "123");
      assert.strictEqual(StringCase.toPascalCase(""), "");
    });
  });

  describe("toCamelCase", () => {
    test("should convert simple strings to camelCase", () => {
      assert.strictEqual(StringCase.toCamelCase("hello world"), "helloWorld");
      assert.strictEqual(StringCase.toCamelCase("my component"), "myComponent");
      assert.strictEqual(StringCase.toCamelCase("test"), "test");
    });

    test("should handle special characters", () => {
      assert.strictEqual(StringCase.toCamelCase("hello-world"), "helloWorld");
      assert.strictEqual(StringCase.toCamelCase("hello_world"), "helloWorld");
      assert.strictEqual(StringCase.toCamelCase("test-component-name"), "testComponentName");
    });

    test("should handle PascalCase input", () => {
      assert.strictEqual(StringCase.toCamelCase("MyComponent"), "myComponent");
      assert.strictEqual(StringCase.toCamelCase("TestComponentName"), "testComponentName");
    });
  });

  describe("toKebabCase", () => {
    test("should convert simple strings to kebab-case", () => {
      assert.strictEqual(StringCase.toKebabCase("hello world"), "hello-world");
      assert.strictEqual(StringCase.toKebabCase("my component"), "my-component");
      assert.strictEqual(StringCase.toKebabCase("test"), "test");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toKebabCase("myComponent"), "my-component");
      assert.strictEqual(StringCase.toKebabCase("MyComponent"), "my-component");
      assert.strictEqual(StringCase.toKebabCase("testComponentName"), "test-component-name");
    });

    test("should handle special characters", () => {
      assert.strictEqual(StringCase.toKebabCase("hello_world"), "hello-world");
      assert.strictEqual(StringCase.toKebabCase("hello-world"), "hello-world");
      assert.strictEqual(StringCase.toKebabCase("test@component#name"), "test-component-name");
    });
  });

  describe("toSnakeCase", () => {
    test("should convert simple strings to snake_case", () => {
      assert.strictEqual(StringCase.toSnakeCase("hello world"), "hello_world");
      assert.strictEqual(StringCase.toSnakeCase("my component"), "my_component");
      assert.strictEqual(StringCase.toSnakeCase("test"), "test");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toSnakeCase("myComponent"), "my_component");
      assert.strictEqual(StringCase.toSnakeCase("MyComponent"), "my_component");
      assert.strictEqual(StringCase.toSnakeCase("testComponentName"), "test_component_name");
    });
  });

  describe("toConstantCase", () => {
    test("should convert simple strings to CONSTANT_CASE", () => {
      assert.strictEqual(StringCase.toConstantCase("hello world"), "HELLO_WORLD");
      assert.strictEqual(StringCase.toConstantCase("my component"), "MY_COMPONENT");
      assert.strictEqual(StringCase.toConstantCase("test"), "TEST");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toConstantCase("myComponent"), "MY_COMPONENT");
      assert.strictEqual(StringCase.toConstantCase("MyComponent"), "MY_COMPONENT");
      assert.strictEqual(StringCase.toConstantCase("testComponentName"), "TEST_COMPONENT_NAME");
    });
  });

  describe("toTitleCase", () => {
    test("should convert simple strings to Title Case", () => {
      assert.strictEqual(StringCase.toTitleCase("hello world"), "Hello World");
      assert.strictEqual(StringCase.toTitleCase("my component"), "My Component");
      assert.strictEqual(StringCase.toTitleCase("test"), "Test");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toTitleCase("myComponent"), "My Component");
      assert.strictEqual(StringCase.toTitleCase("MyComponent"), "My Component");
      assert.strictEqual(StringCase.toTitleCase("testComponentName"), "Test Component Name");
    });
  });

  describe("toLowerCase", () => {
    test("should convert simple strings to lowercase without spaces", () => {
      assert.strictEqual(StringCase.toLowerCase("HELLO WORLD"), "helloworld");
      assert.strictEqual(StringCase.toLowerCase("My Component"), "mycomponent");
      assert.strictEqual(StringCase.toLowerCase("TEST"), "test");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toLowerCase("myComponent"), "mycomponent");
      assert.strictEqual(StringCase.toLowerCase("MyComponent"), "mycomponent");
      assert.strictEqual(StringCase.toLowerCase("TestComponentName"), "testcomponentname");
    });

    test("should remove special characters", () => {
      assert.strictEqual(StringCase.toLowerCase("hello-world"), "helloworld");
      assert.strictEqual(StringCase.toLowerCase("test_component"), "testcomponent");
      assert.strictEqual(StringCase.toLowerCase("user@profile"), "userprofile");
    });
  });

  describe("toLowerCaseWithSpaces", () => {
    test("should convert simple strings to lowercase with spaces", () => {
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("HELLO WORLD"), "hello world");
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("My Component"), "my component");
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("TEST"), "test");
    });

    test("should handle camelCase and PascalCase", () => {
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("myComponent"), "my component");
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("MyComponent"), "my component");
      assert.strictEqual(StringCase.toLowerCaseWithSpaces("TestComponentName"), "test component name");
    });
  });
});

describe("Template variable functions", () => {
  describe("generateTemplateVariables", () => {
    test("should generate all case variations", () => {
      const variables = generateTemplateVariables("my component");

      assert.strictEqual(variables.templateNameToPascalCase, "MyComponent");
      assert.strictEqual(variables.templateNameToCamelCase, "myComponent");
      assert.strictEqual(variables.templateNameToDashCase, "my-component");
      assert.strictEqual(variables.templateNameToSnakeCase, "my_component");
      assert.strictEqual(variables.templateNameToConstantCase, "MY_COMPONENT");
      assert.strictEqual(variables.templateNameToTitleCase, "My Component");
      assert.strictEqual(variables.templateNameToLowerCase, "mycomponent");
      assert.strictEqual(variables.templateNameToLowerCaseWithSpaces, "my component");
    });

    test("should handle complex names", () => {
      const variables = generateTemplateVariables("user-profile-card");

      assert.strictEqual(variables.templateNameToPascalCase, "UserProfileCard");
      assert.strictEqual(variables.templateNameToCamelCase, "userProfileCard");
      assert.strictEqual(variables.templateNameToDashCase, "user-profile-card");
      assert.strictEqual(variables.templateNameToSnakeCase, "user_profile_card");
      assert.strictEqual(variables.templateNameToConstantCase, "USER_PROFILE_CARD");
      assert.strictEqual(variables.templateNameToTitleCase, "User Profile Card");
      assert.strictEqual(variables.templateNameToLowerCase, "userprofilecard");
      assert.strictEqual(variables.templateNameToLowerCaseWithSpaces, "user profile card");
    });
  });

  describe("replaceTemplateVariables", () => {
    test("should replace all template placeholders", () => {
      const content = `
export const __templateNameToPascalCase__ = () => {
  const id = '__templateNameToCamelCase__Id';
  const className = '__templateNameToDashCase__-container';
  const constant = '__templateNameToConstantCase___CONFIG';
  const fileName = '__templateNameToSnakeCase__.js';
  const title = '__templateNameToTitleCase__';
  const key = '__templateNameToLowerCase__';
  const description = '__templateNameToLowerCaseWithSpaces__ component';
  return <div className={className} id={id}>__templateNameToPascalCase__</div>;
};`;

      const variables = generateTemplateVariables("my component");
      const result = replaceTemplateVariables(content, variables);

      assert(result.includes("MyComponent"));
      assert(result.includes("myComponent"));
      assert(result.includes("my-component"));
      assert(result.includes("MY_COMPONENT"));
      assert(result.includes("my_component"));
      assert(result.includes("My Component"));
      assert(result.includes("mycomponent"));
      assert(result.includes("my component"));
      assert(!result.includes("__templateNameToPascalCase__"));
      assert(!result.includes("__templateNameToCamelCase__"));
      assert(!result.includes("__templateNameToDashCase__"));
      assert(!result.includes("__templateNameToConstantCase__"));
      assert(!result.includes("__templateNameToSnakeCase__"));
      assert(!result.includes("__templateNameToTitleCase__"));
      assert(!result.includes("__templateNameToLowerCase__"));
      assert(!result.includes("__templateNameToLowerCaseWithSpaces__"));
    });

    test("should handle content without placeholders", () => {
      const content = "This is a regular string without placeholders";
      const variables = generateTemplateVariables("test");
      const result = replaceTemplateVariables(content, variables);

      assert.strictEqual(result, content);
    });

    test("should handle multiple occurrences of same placeholder", () => {
      const content = "__templateNameToPascalCase__ and __templateNameToPascalCase__ again";
      const variables = generateTemplateVariables("test");
      const result = replaceTemplateVariables(content, variables);

      assert.strictEqual(result, "Test and Test again");
    });
  });
});
