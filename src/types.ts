/**
 * Represents a template that can be used to generate files or directories
 */
export interface Template {
  /** Name of the template */
  name: string;
  /** File system path to the template */
  path: string;
  /** Type of template - either a single file or directory structure */
  type: "file" | "directory";
}

/**
 * Variables used for template placeholder replacement
 */
export interface TemplateVariables {
  /** Component name in PascalCase format (e.g., MyComponent) */
  templateNameToPascalCase: string;
  /** Component name in camelCase format (e.g., myComponent) */
  templateNameToCamelCase: string;
  /** Component name in kebab-case format (e.g., my-component) */
  templateNameToDashCase: string;
  /** Component name in snake_case format (e.g., my_component) */
  templateNameToSnakeCase: string;
  /** Component name in CONSTANT_CASE format (e.g., MY_COMPONENT) */
  templateNameToConstantCase: string;
  /** Component name in Title Case format (e.g., My Component) */
  templateNameToTitleCase: string;
  /** Component name in simple lowercase format (e.g., mycomponent) */
  templateNameToLowerCase: string;
  /** Component name in lowercase with spaces (e.g., my component) */
  templateNameToLowerCaseWithSpaces: string;
}

/**
 * Configuration for an output directory where templates can be generated
 */
export interface OutputDirectory {
  /** Display name for the directory */
  name: string;
  /** File system path to the directory */
  path: string;
  /** Optional description explaining the directory's purpose */
  description?: string;
}

/**
 * Main configuration object for the template system
 */
export interface TemplateConfig {
  /** List of available output directories for template generation */
  outputDirectories: OutputDirectory[];
  /** Function to transform the input name for directory templates (optional) */
  transformName?: (name: string, variables: TemplateVariables) => string;
}
