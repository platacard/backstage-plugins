---
'@platacard/backstage-plugin-scaffolder-backend-module-json-merge-action': patch
'@platacard/backstage-plugin-scaffolder-backend-module-yaml-merge-actions': patch
---

Upgrade Backstage to 1.50.3. Migrated the `scaffolderActionsExtensionPoint`
import from `@backstage/plugin-scaffolder-node/alpha` to
`@backstage/plugin-scaffolder-node` now that it is stable. No behavior or API
changes for adopters.
