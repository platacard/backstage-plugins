# backstage-plugin-scaffolder-backend-module-json-merge-action

A Backstage Scaffolder backend module that provides custom actions for merging
JSON files during the scaffolding process.

## Overview

This plugin adds two powerful JSON merging actions to your Backstage Scaffolder:

- `json:merge-file` - Merges a single JSON file with inline data
- `json:merge-files` - Merges multiple JSON files together

These actions are particularly useful when you need to combine configuration
files, merge API responses, or consolidate JSON data during template execution.

## Installation

Add the plugin to your backend:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @platacard/backstage-plugin-scaffolder-backend-module-json-merge-action
```

## Configuration

Add the module to your backend in `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other modules

backend.add(
  import(
    '@platacard/backstage-plugin-scaffolder-backend-module-json-merge-action'
  ),
);

backend.start();
```

## Actions

### json:merge-file

Merges a JSON file with inline data using the
[json-merger](https://www.npmjs.com/package/json-merger) library.

#### Input Schema

| Parameter          | Type   | Required | Description                                                              |
| ------------------ | ------ | -------- | ------------------------------------------------------------------------ |
| `inputFile`        | string | Yes      | The file in the working directory to merge                               |
| `outputFileName`   | string | Yes      | The name of the file to write to                                         |
| `outputFilePath`   | string | No       | The path to output the file to. Defaults to the task's working directory |
| `jsonMergeOptions` | object | No       | Options to pass to the JSON merge function                               |

#### Example Usage

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: json-merge-example
  title: JSON Merge Example
spec:
  steps:
    - id: merge-config
      name: Merge Configuration
      action: json:merge-file
      input:
        inputFile: base-config.json
        outputFileName: merged-config.json
        outputFilePath: config
```

### json:merge-files

Merges multiple JSON files together into a single output file.

#### Input Schema

| Parameter          | Type     | Required | Description                                                              |
| ------------------ | -------- | -------- | ------------------------------------------------------------------------ |
| `inputFiles`       | string[] | Yes      | Array of files in the working directory to merge                         |
| `outputFileName`   | string   | Yes      | The name of the file to write to                                         |
| `outputFilePath`   | string   | No       | The path to output the file to. Defaults to the task's working directory |
| `jsonMergeOptions` | object   | No       | Options to pass to the JSON merge function                               |

#### Example Usage

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: multi-json-merge-example
  title: Multiple JSON Merge Example
spec:
  steps:
    - id: merge-configs
      name: Merge Multiple Configurations
      action: json:merge-files
      input:
        inputFiles:
          - defaults.json
          - environment.json
          - overrides.json
        outputFileName: final-config.json
        outputFilePath: dist
```

## JSON Merge Options

The `jsonMergeOptions` parameter accepts configuration options from the
[json-merger](https://www.npmjs.com/package/json-merger) library.
