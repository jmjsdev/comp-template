# Development Guide

This guide contains essential information for developers working on the @jmjs/comp-template project.

## Project Overview

### Dependencies
- **Runtime**: `inquirer` (interactive CLI prompts)
- **Development**: `typescript`, `ts-node`, `@types/node`, `@types/inquirer`
- **Testing**: Node.js native test runner (`node:test`)

### Key Components
- **CLI** (`src/cli.ts`) - Entry point with `init` and `generate` commands
- **TemplateManager** (`src/template-manager.ts`) - Core template processing
- **Utils** (`src/utils.ts`) - String transformations (StringCase class)
- **FileUtils** (`src/file-utils.ts`) - File system operations

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development
npm run dev

# Run tests
npm test
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage analysis
npm run coverage

# Coverage with HTML report
npm run coverage:open
```

### Coverage Standards
The project maintains high test coverage standards:
- **Minimum thresholds**: Lines 72%, Functions 77%, Branches 76%
- **Current coverage**: >72% across all metrics
- **Goal**: Maintain or improve coverage with new features

### Coverage Reports
- **Text output**: Immediate console feedback
- **HTML report**: Detailed file-by-file analysis in `coverage/`
- **LCOV format**: For CI/CD integration and external tools

### Local Testing
The recommended way to test the CLI locally:

```bash
# 1. Build and pack
npm run build
npm pack

# 2. Create test project
mkdir test-project && cd test-project
npm init -y

# 3. Install local package
npm install ../jmjs-comp-template-*.tgz

# 4. Test commands
npx template init
npx template generate
```

## Development Workflow

1. **Make changes** to source code
2. **Run tests**: `npm test`
3. **Build**: `npm run build`
4. **Test locally** using the method above
5. **Verify** templates work as expected

## Project Structure

```
src/
├── cli.ts                    # CLI entry point
├── template-manager.ts       # Template processing logic
├── utils.ts                  # String utilities
├── file-utils.ts            # File operations
├── types.ts                  # Type definitions
└── *.test.ts                # Test files

templates/
└── component/               # Example template
    ├── __templateNameToPascalCase__.tsx
    ├── __templateNameToDashCase__.css
    └── __templateNameToCamelCase__.test.tsx
```

## Adding Features

### New Template Variable
1. Update `TemplateVariables` interface in `types.ts`
2. Update `generateTemplateVariables()` in `utils.ts`
3. Add tests in `utils.test.ts`

### New CLI Command
1. Add to `CommandName` type in `cli.ts`
2. Implement in `commands` object
3. Add tests

## Common Issues

- **Template not found**: Ensure `templates/` directory exists
- **Permission errors**: Check file permissions
- **Build errors**: Run `npm run build` and check TypeScript errors
- **npx not working**: Verify `bin` field in `package.json`

## Contributing

1. Fork and create feature branch
2. Add tests for new functionality
3. Run `npm test` and `npm run build`
4. Test locally with `npm pack`
5. Submit Pull Request

## Release Process

1. Update version in `package.json`
2. Run tests and build: `npm test && npm run build`
3. Test with `npm pack`
4. Tag release: `git tag v0.0.x`
5. Push and publish: `git push --tags && npm publish` 