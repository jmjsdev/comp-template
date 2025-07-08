# Guide d'utilisation du système de sandbox pour les tests

## Pourquoi utiliser un système de sandbox ?

Le système de sandbox utilise **memfs** pour créer un filesystem en mémoire complètement isolé. Cela offre plusieurs avantages :

✅ **Sécurité** : Les tests ne peuvent pas supprimer ou modifier les fichiers réels du projet
✅ **Isolation** : Chaque test a son propre environnement isolé
✅ **Rapidité** : Les opérations sur un filesystem en mémoire sont très rapides
✅ **Reproductibilité** : L'état initial est toujours le même
✅ **Facilité de debug** : On peut inspecter l'état du filesystem à tout moment

## Installation

```bash
npm install --save-dev memfs fs-monkey
```

## Utilisation de base

### 1. Import du système de sandbox

```typescript
import { TestSandbox, SandboxHelpers } from "./test-sandbox";
```

### 2. Configuration dans vos tests

```typescript
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { SandboxHelpers } from "./test-sandbox";

describe("Mon Test avec Sandbox", () => {
  beforeEach(() => {
    // Setup sandbox avec structure par défaut
    SandboxHelpers.setupTest();
  });

  afterEach(() => {
    // Nettoyage automatique
    SandboxHelpers.cleanup();
  });

  test("mon test", async () => {
    // Votre code de test ici
    // Tous les fichiers créés/modifiés sont dans le sandbox
  });
});
```

## Types de structures disponibles

### 1. Structure complète (`setupTest()`)

Crée une structure de projet complète avec :
- `.template/` avec des templates React, Angular, hooks
- `src/components/`, `src/hooks/`, `src/utils/`
- `template.config.js` avec configuration par défaut

### 2. Structure minimale (`setupMinimalTest()`)

Crée une structure basique avec :
- Un template simple
- Configuration minimale

### 3. Structure avec templates invalides (`setupInvalidTemplateTest()`)

Crée une structure avec des templates invalides pour tester la gestion d'erreurs.

## Exemples d'utilisation

### Test de TemplateManager

```typescript
describe("TemplateManager with Sandbox", () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    SandboxHelpers.setupTest();
    templateManager = new TemplateManager(".template");
  });

  afterEach(() => {
    SandboxHelpers.cleanup();
  });

  test("should generate component from template", async () => {
    // Génération du composant
    await templateManager.generateFromTemplate("react-component", "TestButton", "./src/components");

    // Vérification des fichiers générés dans le sandbox
    assert(TestSandbox.fileExists("./src/components/TestButton.tsx"));
    assert(TestSandbox.fileExists("./src/components/TestButton.test.tsx"));
    
    // Vérification du contenu
    const content = TestSandbox.readFile("./src/components/TestButton.tsx");
    assert(content.includes("export const TestButton"));
  });
});
```

### Test avec structure personnalisée

```typescript
test("should work with custom structure", async () => {
  TestSandbox.init();
  TestSandbox.reset();
  
  // Création d'une structure personnalisée
  TestSandbox.createDirectoryStructure({
    ".template/my-template.tsx": `export const __templateNameToPascalCase__ = () => {
      return <div>Custom</div>;
    };`,
    "output/": null,
  });

  try {
    const templateManager = new TemplateManager(".template");
    await templateManager.generateFromTemplate("my-template.tsx", "MyComponent", "./output");
    
    assert(TestSandbox.fileExists("./output/my-template.tsx"));
  } finally {
    SandboxHelpers.cleanup();
  }
});
```

## API du TestSandbox

### Méthodes principales

```typescript
// Initialisation
TestSandbox.init()           // Initialise le sandbox
TestSandbox.reset()          // Vide le sandbox
TestSandbox.restore()        // Restaure le filesystem réel

// Manipulation des fichiers
TestSandbox.fileExists(path)       // Vérifie si un fichier existe
TestSandbox.readFile(path)         // Lit un fichier
TestSandbox.writeFile(path, content) // Écrit un fichier
TestSandbox.createFile(path, content) // Crée un fichier avec ses dossiers
TestSandbox.listFiles(path)        // Liste les fichiers d'un dossier

// Structure
TestSandbox.createDirectoryStructure(structure) // Crée une structure
TestSandbox.getFilesystemState()   // Obtient l'état complet (debug)
```

### Création de structures

```typescript
const structure = {
  "file.txt": "contenu du fichier",
  "dossier/": null,  // Dossier vide
  "dossier/sous-fichier.txt": "contenu",
};

TestSandbox.createDirectoryStructure(structure);
```

## Migration des tests existants

### Ancien code (dangereux)

```typescript
// ❌ Dangereux - manipule les vrais fichiers
describe("Test dangereux", () => {
  beforeEach(async () => {
    await mkdir("./test-templates", { recursive: true });
  });

  afterEach(async () => {
    await rm("./test-templates", { recursive: true, force: true });
  });

  test("should create template", async () => {
    await writeFile("./test-templates/component.tsx", "template content");
    // Test...
  });
});
```

### Nouveau code (sécurisé)

```typescript
// ✅ Sécurisé - utilise le sandbox
describe("Test sécurisé", () => {
  beforeEach(() => {
    SandboxHelpers.setupTest();
  });

  afterEach(() => {
    SandboxHelpers.cleanup();
  });

  test("should create template", async () => {
    TestSandbox.createFile("./test-templates/component.tsx", "template content");
    // Test...
  });
});
```

## Bonnes pratiques

### 1. Toujours nettoyer après les tests

```typescript
afterEach(() => {
  SandboxHelpers.cleanup();
});
```

### 2. Utiliser des structures prédéfinies quand possible

```typescript
// ✅ Bon
SandboxHelpers.setupTest();

// ❌ Éviter (sauf si nécessaire)
TestSandbox.createDirectoryStructure({...});
```

### 3. Vérifier l'état du sandbox pour le debug

```typescript
test("debug test", () => {
  SandboxHelpers.setupTest();
  
  // Debug: voir l'état du filesystem
  console.log(TestSandbox.getFilesystemState());
  
  // Test...
});
```

### 4. Utiliser des noms de fichiers explicites

```typescript
// ✅ Bon
TestSandbox.createFile("./test-data/component.tsx", content);

// ❌ Éviter
TestSandbox.createFile("./temp.txt", content);
```

## Comparaison avec l'ancien système

| Aspect               | Ancien système                        | Nouveau système (Sandbox)    |
| -------------------- | ------------------------------------- | ---------------------------- |
| **Sécurité**         | ❌ Peut supprimer des fichiers réels   | ✅ Complètement isolé         |
| **Vitesse**          | ❌ I/O disque lent                     | ✅ Mémoire très rapide        |
| **Isolation**        | ❌ Tests peuvent s'affecter            | ✅ Isolation complète         |
| **Nettoyage**        | ❌ Peut laisser des fichiers orphelins | ✅ Nettoyage automatique      |
| **Reproductibilité** | ❌ Dépend de l'état du disque          | ✅ État initial garanti       |
| **Debugging**        | ❌ Difficile à inspecter               | ✅ État visible à tout moment |

## Résolution des problèmes

### Le sandbox ne fonctionne pas

1. Vérifiez que `memfs` et `fs-monkey` sont installés
2. Assurez-vous d'appeler `TestSandbox.init()` avant utilisation
3. Vérifiez que `SandboxHelpers.cleanup()` est appelé après chaque test

### Les fichiers ne sont pas trouvés

1. Utilisez `TestSandbox.getFilesystemState()` pour voir l'état actuel
2. Vérifiez les chemins (utilisez `./` pour les chemins relatifs)
3. Assurez-vous que la structure a été créée avec `createDirectoryStructure()`

### Les tests sont lents

1. Utilisez `setupMinimalTest()` au lieu de `setupTest()` si possible
2. Évitez de créer des structures trop complexes
3. Assurez-vous de nettoyer après chaque test

## Exemple complet

```typescript
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { TemplateManager } from "./template-manager";
import { TestSandbox, SandboxHelpers } from "./test-sandbox";

describe("TemplateManager Tests Complets", () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    SandboxHelpers.setupTest();
    templateManager = new TemplateManager(".template");
  });

  afterEach(() => {
    SandboxHelpers.cleanup();
  });

  test("should list templates", async () => {
    const templates = await templateManager.listTemplates();
    assert(templates.length > 0);
  });

  test("should generate component", async () => {
    await templateManager.generateFromTemplate("react-component", "TestButton", "./src/components");
    
    assert(TestSandbox.fileExists("./src/components/TestButton.tsx"));
    const content = TestSandbox.readFile("./src/components/TestButton.tsx");
    assert(content.includes("TestButton"));
  });

  test("should handle custom structure", async () => {
    TestSandbox.reset();
    TestSandbox.createDirectoryStructure({
      ".template/custom.tsx": "export const __templateNameToPascalCase__ = () => null;",
      "output/": null,
    });

    await templateManager.generateFromTemplate("custom.tsx", "Custom", "./output");
    assert(TestSandbox.fileExists("./output/custom.tsx"));
  });
});
```

Ce système de sandbox garantit que vos tests sont sûrs, rapides et reproductibles ! 🎯 