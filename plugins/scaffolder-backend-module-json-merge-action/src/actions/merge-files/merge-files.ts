import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import * as jsonMerger from 'json-merger';
import fsPromises from 'fs/promises';
import ensureDirectoryExists from '../../helpers/ensureDirectoryExists';

export function createJsonMergeFilesAction() {
  return createTemplateAction({
    id: 'json:merge-files',
    description: 'Merges two or more files',
    supportsDryRun: true,
    schema: {
      input: z =>
        z.object({
          inputFiles: z
            .array(z.string())
            .describe('The files in the working directory to merge'),
          outputFileName: z.string({
            description: 'The name of the file to write to',
          }),
          outputFilePath: z
            .string({
              description:
                "The path to output the file to. Defaults to the task's working directory",
            })
            .optional(),
          jsonMergeOptions: z
            .record(z.any())
            .optional()
            .describe('Options to pass to the JSON mergeFiles function'),
        }),
    },
    async handler(ctx) {
      try {
        console.log(`Running json merge in ${ctx.workspacePath}`);
        ctx.logger.info(`Running json merge in ${ctx.workspacePath}`);

        const config = {
          ...ctx.input.jsonMergeOptions,
          cwd: ctx.workspacePath,
        };

        const result = jsonMerger.mergeFiles(ctx.input.inputFiles, config);

        const outputPathAndFile = `${ctx.workspacePath}/${
          ctx.input.outputFilePath ?? ''
        }/${ctx.input.outputFileName}`.replace('//', '/');

        if (ctx.input.outputFilePath) {
          await ensureDirectoryExists(
            `${ctx.workspacePath}/${ctx.input.outputFilePath}`,
          );
        }

        const resultJson = JSON.stringify(result, null, 2);

        ctx.logger.info(
          `Writing result to output with filePath ${ctx.workspacePath}/${ctx.input.outputFilePath}`,
        );
        ctx.logger.info(`Result: ${resultJson}`);

        await fsPromises.writeFile(outputPathAndFile, resultJson);
      } catch (err) {
        console.error(err);
        ctx.logger.error(String(err));
        throw err;
      }
    },
  });
}
