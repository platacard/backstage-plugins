import { createTemplateAction } from "@backstage/plugin-scaffolder-node";
import { YamlMerger} from "./yaml-merger";

export function createYamlMergeAction() {
  return createTemplateAction<{
    inputFile: string;
    overlayFile: string;
    outputFileName: string;
    outputFilePath?: string;
    yamlMergeOptions?: object;
  }>({
    id: "yaml:merge",
    description: "Merges two files",
    supportsDryRun: true,
    schema: {
      input: {
        type: "object",
        required: ["inputFile", "outputFileName"],
        properties: {
          inputFile: {
            title: "Input file",
            description: "The file in the working directory to merge",
            type: "string",
          },
          overlayFile: {
            title: "Overlay file which data you need to apply",
            description: "The file in the working directory to merge",
            type: "string",
          },
          outputFileName: {
            title: "Output file name",
            description: "The name of the file to write to",
            type: "string",
          },
          outputFilePath: {
            title: "Output file path",
            description:
              "The path to output the file to. Defaults to the task's working directory",
            type: "string",
          },
          yamlMergeOptions: {
            title: "YAML merge options",
            description: "Options to pass to the YAML merge function",
            type: "object",
          },
        },
      },
    },
    async handler(ctx) {
      try {
        console.log(`Running yaml merge in ${ctx.workspacePath}`);
        ctx.logger.info(`Running yaml merge in ${ctx.workspacePath}`);

        const config = {
          ...ctx.input.yamlMergeOptions,
          cwd: ctx.workspacePath,
        };

        ctx.logger.info(`input file: ${ctx.input.inputFile}`);

        const merger = new YamlMerger(ctx.input.inputFile, ctx.input.overlayFile, config);

        const outputPathAndFile = `${ctx.workspacePath}/${
          ctx.input.outputFilePath ?? ""
        }/${ctx.input.outputFileName}`.replace("//", "/");

        ctx.logger.info(
          `Writing result to output with filePath ${ctx.workspacePath}/${ctx.input.outputFilePath}`
        );

        merger.saveMergedYAML(outputPathAndFile);
      } catch (err) {
        console.error(err);
        ctx.logger.error(err);
        throw err;
      }
    },
  });
}
