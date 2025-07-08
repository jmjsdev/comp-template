import { TemplateVariables } from "./types";

/**
 * Utility class for string case transformations
 */
export class StringCase {
  /**
   * Convert string to PascalCase (MyComponentName)
   * @param str - Input string to convert
   * @returns String in PascalCase format
   */
  static toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .split(/\s+/) // Split on whitespace
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  /**
   * Convert string to camelCase (myComponentName)
   * @param str - Input string to convert
   * @returns String in camelCase format
   */
  static toCamelCase(str: string): string {
    const pascalCase = StringCase.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Convert string to kebab-case (my-component-name)
   * @param str - Input string to convert
   * @returns String in kebab-case format
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .split(/\s+/) // Split on whitespace
      .map((word) => word.toLowerCase())
      .join("-");
  }

  /**
   * Convert string to snake_case (my_component_name)
   * @param str - Input string to convert
   * @returns String in snake_case format
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .split(/\s+/) // Split on whitespace
      .map((word) => word.toLowerCase())
      .join("_");
  }

  /**
   * Convert string to CONSTANT_CASE (MY_COMPONENT_NAME)
   * @param str - Input string to convert
   * @returns String in CONSTANT_CASE format
   */
  static toConstantCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .split(/\s+/) // Split on whitespace
      .map((word) => word.toUpperCase())
      .join("_");
  }

  /**
   * Convert string to Title Case (My Component Name)
   * @param str - Input string to convert
   * @returns String in Title Case format
   */
  static toTitleCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .split(/\s+/) // Split on whitespace
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Convert string to simple lowercase (mycomponent)
   * @param str - Input string to convert
   * @returns String in lowercase without spaces
   */
  static toLowerCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, "") // Remove non-alphanumeric
      .toLowerCase();
  }

  /**
   * Convert string to lowercase with spaces (my component name)
   * @param str - Input string to convert
   * @returns String in lowercase with spaces
   */
  static toLowerCaseWithSpaces(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ") // Replace non-alphanumeric with spaces
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "); // Normalize spaces
  }
}

/**
 * Generate template variables object from a component name
 * @param name - Component name to generate variables from
 * @returns Template variables object with different case formats
 */
export function generateTemplateVariables(name: string): TemplateVariables {
  return {
    templateNameToPascalCase: StringCase.toPascalCase(name),
    templateNameToCamelCase: StringCase.toCamelCase(name),
    templateNameToDashCase: StringCase.toKebabCase(name),
    templateNameToSnakeCase: StringCase.toSnakeCase(name),
    templateNameToConstantCase: StringCase.toConstantCase(name),
    templateNameToTitleCase: StringCase.toTitleCase(name),
    templateNameToLowerCase: StringCase.toLowerCase(name),
    templateNameToLowerCaseWithSpaces: StringCase.toLowerCaseWithSpaces(name),
  };
}

/**
 * Replace template variable placeholders in content with actual values
 * @param content - String content containing template placeholders
 * @param variables - Template variables to substitute
 * @returns Content with template variables replaced
 */
export function replaceTemplateVariables(content: string, variables: TemplateVariables): string {
  return content
    .replace(/__templateNameToPascalCase__/g, variables.templateNameToPascalCase)
    .replace(/__templateNameToCamelCase__/g, variables.templateNameToCamelCase)
    .replace(/__templateNameToDashCase__/g, variables.templateNameToDashCase)
    .replace(/__templateNameToSnakeCase__/g, variables.templateNameToSnakeCase)
    .replace(/__templateNameToConstantCase__/g, variables.templateNameToConstantCase)
    .replace(/__templateNameToTitleCase__/g, variables.templateNameToTitleCase)
    .replace(/__templateNameToLowerCase__/g, variables.templateNameToLowerCase)
    .replace(/__templateNameToLowerCaseWithSpaces__/g, variables.templateNameToLowerCaseWithSpaces);
}
