# Templates Directory

This directory contains template files that are used to generate new components and files in your project.

## How Templates Work

Templates use special variable placeholders that get replaced when you generate files:

- `__templateNameToPascalCase__` → PascalCase (e.g., `MyComponent`)
- `__templateNameToCamelCase__` → camelCase (e.g., `myComponent`)
- `__templateNameToDashCase__` → kebab-case (e.g., `my-component`)

## Using Templates

Run the template generator:
```bash
npx template
```

This will:
1. Show you available templates
2. Ask you to choose one
3. Ask for a component/file name
4. Generate the files with your chosen name

## Adding Custom Templates

You can add your own templates to this directory:

### File Template
Create a single file with template variables:
```typescript
// my-util.template.ts
export const __templateNameToPascalCase__ = {
  name: '__templateNameToCamelCase__'
};
```

### Directory Template
Create a folder with multiple template files:
```
api-endpoint/
├── __templateNameToDashCase__.controller.ts
├── __templateNameToDashCase__.service.ts
└── __templateNameToPascalCase__.dto.ts
```

## Example Templates

The following templates are included by default:

- **component/** - React component with styles and tests

Feel free to modify these templates or add your own!

## Template Variables in Action

If you choose template name "user profile", the variables become:
- `__templateNameToPascalCase__` → `UserProfile`
- `__templateNameToCamelCase__` → `userProfile`
- `__templateNameToDashCase__` → `user-profile` 