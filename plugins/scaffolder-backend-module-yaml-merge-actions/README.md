# backstage-plugin-scaffolder-backend-module-yaml-merge-actions

A Backstage Scaffolder backend module that provides a custom action for merging
YAML files with configurable merge strategies.

## Overview

This plugin adds a `yaml:merge` action to your Backstage Scaffolder that allows
you to merge YAML files during the scaffolding process. It supports different
merge strategies for arrays and preserves YAML structure and comments.

## Features

- **Deep merging** of YAML structures
- **Configurable array merge strategies**: concat, replace, or unique
- **Comment preservation** in YAML files
- **Dry run support** for testing
- **Flexible output paths** for generated files

## Installation

Add the plugin to your backend:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @platacard/backstage-plugin-scaffolder-backend-module-yaml-merge-actions
```

## Configuration

Add the module to your backend in `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other modules

backend.add(
  import(
    '@platacard/backstage-plugin-scaffolder-backend-module-yaml-merge-actions'
  ),
);

backend.start();
```

## Action: yaml:merge

Merges two YAML files with customizable merge strategies.

### Input Schema

| Parameter          | Type   | Required | Description                                                              |
| ------------------ | ------ | -------- | ------------------------------------------------------------------------ |
| `inputFile`        | string | Yes      | The file in the working directory to merge                               |
| `overlayFile`      | string | Yes      | The file containing data to merge into the input file                    |
| `outputFileName`   | string | Yes      | The name of the file to write to                                         |
| `outputFilePath`   | string | No       | The path to output the file to. Defaults to the task's working directory |
| `yamlMergeOptions` | object | No       | Options to control how YAML files are merged                             |

#### yamlMergeOptions

| Option               | Type    | Default  | Description                                                          |
| -------------------- | ------- | -------- | -------------------------------------------------------------------- |
| `arrayMergeStrategy` | string  | `concat` | How to merge arrays: `concat`, `replace`, or `unique`                |
| `prependOnConcat`    | boolean | `false`  | When using concat strategy, prepend overlay arrays instead of append |

### Output Schema

| Parameter    | Type   | Description                                            |
| ------------ | ------ | ------------------------------------------------------ |
| `outputFile` | string | Path to the merged output file (relative to workspace) |

### Example Usage

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: yaml-merge-example
  title: YAML Merge Example
spec:
  steps:
    - id: merge-kubernetes-configs
      name: Merge Kubernetes Configurations
      action: yaml:merge
      input:
        inputFile: base-deployment.yaml
        overlayFile: production-overrides.yaml
        outputFileName: final-deployment.yaml
        outputFilePath: k8s
        yamlMergeOptions:
          arrayMergeStrategy: unique
```

## Merge Strategies

### Object Merging

Objects are deeply merged. Keys from the overlay file override or add to the
input file.

```yaml
# Input file
config:
  database:
    host: localhost
    port: 5432

# Overlay file
config:
  database:
    port: 5433
  cache:
    enabled: true

# Result
config:
  database:
    host: localhost
    port: 5433
  cache:
    enabled: true
```

### Array Merge Strategies

#### concat (default)

Concatenates arrays from both files.

```yaml
# Input: [a, b]
# Overlay: [c, d]
# Result: [a, b, c, d]
# With prependOnConcat: [c, d, a, b]
```

#### replace

Replaces the entire array with the overlay array.

```yaml
# Input: [a, b]
# Overlay: [c, d]
# Result: [c, d]
```

#### unique

Merges arrays keeping only unique values.

```yaml
# Input: [a, b, c]
# Overlay: [b, c, d]
# Result: [a, b, c, d]
```
