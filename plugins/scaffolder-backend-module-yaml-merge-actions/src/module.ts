import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createYamlMergeAction } from './yaml-merge-action';

/**
 * @public
 * The YAML Merge Module for the Scaffolder Backend
 */
export const YamlMerge = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'yaml-merge-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolderActions }) {
        scaffolderActions.addActions(createYamlMergeAction());
      },
    });
  },
});
