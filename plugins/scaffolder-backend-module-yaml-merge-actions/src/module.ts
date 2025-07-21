import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createYamlMergeAction } from './yaml-merge-action';

/**
 * @public
 * The YAML Merge Module for the Scaffolder Backend
 */
export const YamlMerge = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'yaml-merge',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolder }) {
        scaffolder.addActions(
          createYamlMergeAction(),
        );
      },
    });
  },
});
