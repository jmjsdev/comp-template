# @jmjs/comp-template

A lightweight and customizable template generator for JavaScript/TypeScript projects. Create and manage reusable code templates with automatic variable substitution and intelligent naming conventions.

## ✨ Features

- 🚀 **Zero dependencies** except for CLI prompts (inquirer)
- 📁 **Smart directory structure** - Templates stored in hidden `.template/` folder
- 🔄 **Automatic variable substitution** - PascalCase, camelCase, kebab-case
- 📂 **Configurable output directories** - Choose where to generate files
- ⚡ **File and directory templates** - Single files or complete folder structures
- 🛠️ **Easy customization** - Add your own templates and output locations
- 🔧 **One-time setup** - Initialize once, commit to git, ready for the team

## 🚀 Quick Start

### Installation & Setup

```bash
npm install @jmjs/comp-template
# or use directly with npx

# Initialize in your project (one time only)
npx template init
```

This will create:
- `.template/` directory with default templates  
- `template.config.js` with output directory configuration

**💡 Commit these files to git** so your team can use the same templates!

### Daily Usage

```bash
npx template
# Choose template → Enter name → Choose destination → Done!
```

## 📂 Output Directory Configuration

comp-template allows you to configure where generated files are placed using a `template.config.js` file:

```javascript
module.exports = {
  outputDirectories: [
    {
      name: "Components",
      path: "src/components",
      description: "React components directory",
    },
    {
      name: "Pages",
      path: "src/pages", 
      description: "Application pages",
    },
    {
      name: "Utils",
      path: "src/utils",
      description: "Utility functions and helpers",
    },
  ],
};
```

### Configuration Properties

- **name**: Display name for the directory choice
- **path**: Relative path where files will be generated
- **description** (optional): Additional description shown in the CLI

When you run `template`, you'll be prompted to:
1. Choose a template
2. Enter a component/file name  
3. **Choose an output directory** from your configured options

## 🔄 Variable Substitution

Templates support automatic variable replacement:

| Variable                                | Example Input  | Output              |
| --------------------------------------- | -------------- | ------------------- |
| `__templateNameToPascalCase__`          | "user profile" | `UserProfile`       |
| `__templateNameToCamelCase__`           | "user profile" | `userProfile`       |
| `__templateNameToDashCase__`            | "user profile" | `user-profile`      |
| `__templateNameToSnakeCase__`           | "user profile" | `user_profile`      |
| `__templateNameToConstantCase__`        | "user profile" | `USER_PROFILE`      |
| `__templateNameToTitleCase__`           | "user profile" | `User Profile`      |
| `__templateNameToLowerCase__`           | "user profile" | `userprofile`       |
| `__templateNameToLowerCaseWithSpaces__` | "user profile" | `user profile`      |

## 📁 Template Structure

Templates are stored in the `.template/` directory:

```
.template/
├── README.md
├── component/                     # Directory template
│   ├── __templateNameToPascalCase__.tsx
│   ├── __templateNameToCamelCase__.test.tsx
│   └── __templateNameToDashCase__.css
└── util.ts                       # File template
```

### File Templates
Single files with variable substitution:
```typescript
// .template/service.ts
export class __templateNameToPascalCase__Service {
  // Service implementation
}
```

### Directory Templates  
Complete folder structures:
```
.template/api-endpoint/
├── __templateNameToDashCase__.controller.ts
├── __templateNameToDashCase__.service.ts
└── __templateNameToPascalCase__.dto.ts
```

## 🛠️ Commands

| Command            | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `template`         | Interactive template generation (default)                     |
| `template init`    | Initialize comp-template (templates + config) in your project |
| `template install` | Manually install templates (useful with npm link)             |
| `template config`  | Create/update template.config.js                              |

## 📖 Examples

### First Time Setup

```bash
# In your project directory
npx template init

# Commit the generated files
git add .template/ template.config.js
git commit -m "Add @jmjs/comp-template configuration"
```

### Generate a React Component

1. Run `template`
2. Choose "component (directory)"
3. Enter name: "user-card"  
4. Choose output: "Components (src/components)"

Result in `src/components/UserCard/`:
```
UserCard/
├── UserCard.tsx
├── userCard.test.tsx
├── user-card.css
└── README.md
```

### Generate a Utility Function

1. Run `template`
2. Choose "util.ts (file)"
3. Enter name: "date helper"
4. Choose output: "Utils (src/utils)"

Result: `src/utils/DateHelper.ts`

## 🏗️ Project Structure

```
src/
├── cli.ts              # Main CLI interface
├── template-manager.ts # Template processing logic
├── config-manager.ts   # Configuration handling
├── file-utils.ts      # Custom file operations  
├── utils.ts           # String case utilities
├── install.ts         # Post-install template setup
└── types.ts           # TypeScript definitions
```

## 🧪 Testing

```bash
npm test                # Run all tests with Node.js test runner
npm run test:watch      # Watch mode for development
npm run coverage        # Run tests with coverage analysis
npm run coverage:open   # Run coverage and open HTML report
```

### Coverage Reports

This project maintains high test coverage:
- **Lines**: >72%
- **Functions**: >77% 
- **Branches**: >76%
- **Statements**: >72%

Coverage reports are generated in multiple formats:
- **Console**: Immediate feedback during development
- **HTML**: Detailed report in `coverage/index.html`
- **LCOV**: For CI/CD integration

## Development Workflow

For development, read the [development workflow](./DEVELOPMENT.md) file.

## 📝 License

MIT 