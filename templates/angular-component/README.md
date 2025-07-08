# __templateNameToPascalCase__ Component

Simple Angular component generated component

## Files Generated

- `__templateNameToDashCase__.component.ts` - Component class
- `__templateNameToDashCase__.component.html` - Template
- `__templateNameToDashCase__.component.css` - Styles
- `__templateNameToDashCase__.component.spec.ts` - Tests

## Usage

### 1. Import in module

```typescript
import { __templateNameToPascalCase__Component } from './path/to/__templateNameToDashCase__.component';

@NgModule({
  declarations: [__templateNameToPascalCase__Component],
  // ...
})
export class YourModule { }
```

### 2. Use in template

```html
<app-__templateNameToDashCase__
  [title]="'My Component'"
  [data]="yourData"
  (onClick)="handleClick($event)">
</app-__templateNameToDashCase__>
```

## Properties

**Inputs:**
- `title: string` - Component title
- `data: any` - Data to display

**Outputs:**
- `onClick` - Emitted when button clicked

## Features

- Simple data display
- Click event handling
- Clean, minimal design

## Testing

```bash
ng test
``` 