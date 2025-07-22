import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { YamlMerger } from './yaml-merger';
import * as path from 'path';
import * as fs from 'fs-extra';

export function createYamlMergeAction() {
  return createTemplateAction({
    id: 'yaml:merge',
    description: 'Merges two YAML files with customizable merge strategies',
    supportsDryRun: true,
    schema: {
      input: z =>
        z.object({
          inputFile: z
            .string()
            .describe('The file in the working directory to merge'),
          overlayFile: z
            .string()
            .describe('The file containing data to merge into the input file'),
          outputFileName: z
            .string()
            .describe('The name of the file to write to'),
          outputFilePath: z
            .string()
            .optional()
            .describe(
              "The path to output the file to. Defaults to the task's working directory",
            ),
          yamlMergeOptions: z
            .object({
              arrayMergeStrategy: z
                .enum(['concat', 'replace', 'unique'])
                .optional()
                .describe(
                  'How to merge arrays: concat (default), replace, or unique',
                ),
              prependOnConcat: z
                .boolean()
                .optional()
                .describe(
                  'When using concat strategy, prepend overlay arrays instead of append',
                ),
            })
            .optional()
            .describe('Options to control how YAML files are merged'),
        }),
      output: z =>
        z.object({
          outputFile: z.string().describe('Path to the merged output file'),
        }),
    },
    async handler(ctx) {
      const {
        inputFile,
        overlayFile,
        outputFileName,
        outputFilePath,
        yamlMergeOptions,
      } = ctx.input;

      // Validate input files exist
      const inputPath = path.join(ctx.workspacePath, inputFile);
      const overlayPath = path.join(ctx.workspacePath, overlayFile);

      if (!(await fs.pathExists(inputPath))) {
        throw new Error(`Input file not found: ${inputFile}`);
      }

      if (!(await fs.pathExists(overlayPath))) {
        throw new Error(`Overlay file not found: ${overlayFile}`);
      }

      ctx.logger.info(`Merging YAML files: ${inputFile} + ${overlayFile}`);

      const config = {
        ...yamlMergeOptions,
        cwd: ctx.workspacePath,
      };

      const merger = new YamlMerger(inputFile, overlayFile, config);

      // Construct output path
      const outputDir = outputFilePath
        ? path.join(ctx.workspacePath, outputFilePath)
        : ctx.workspacePath;

      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      const outputFullPath = path.join(outputDir, outputFileName);

      ctx.logger.info(`Writing merged YAML to: ${outputFullPath}`);

      // Only write if not in dry run mode
      if (!ctx.isDryRun) {
        merger.saveMergedYAML(outputFullPath);
        ctx.logger.info('YAML merge completed successfully');
      } else {
        ctx.logger.info('Dry run mode - no files written');
      }

      // Set output for downstream actions
      ctx.output(
        'outputFile',
        path.relative(ctx.workspacePath, outputFullPath),
      );
    },
  });
}
