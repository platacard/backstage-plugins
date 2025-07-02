import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import {
  createJsonMergeFileAction,
  createJsonMergeFilesAction,
} from './actions';

/**
 * @public
 * The JSON Merge Module for the Scaffolder Backend
 */
export const JsonMerge = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'json-merge',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolder }) {
        scaffolder.addActions(
          createJsonMergeFileAction(),
          createJsonMergeFilesAction(),
        );
      },
    });
  },
});
