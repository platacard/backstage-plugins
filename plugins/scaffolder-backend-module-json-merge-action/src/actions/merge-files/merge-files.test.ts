import { createJsonMergeFilesAction } from './merge-files';
import { mockServices } from '@backstage/backend-test-utils';
import fs from 'fs/promises';
import path from 'path';

jest.mock('@backstage/plugin-scaffolder-backend', () => ({
  ...jest.requireActual('@backstage/plugin-scaffolder-backend'),
  executeShellCommand: jest.fn(),
}));

describe('json:merge', () => {
  beforeEach(async () => {
    await fs.mkdir(path.resolve(__dirname, './test-files/results'));
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await fs.rm(path.resolve(__dirname, './test-files/results'), {
      recursive: true,
      force: true,
    });
  });

  it('should call action', async () => {
    const action = createJsonMergeFilesAction();

    const logger = mockServices.logger.mock();

    const workspacePath = path.resolve(__dirname, './test-files');

    await action.handler({
      input: {
        inputFiles: ['test-file-1.json', 'test-file-2.json'],
        outputFileName: 'result.json',
        outputFilePath: 'results',
      },
      workspacePath,
      logger,
      output: jest.fn(),
      createTemporaryDirectory() {
        throw new Error('Not implemented');
      },
      checkpoint: jest.fn(),
      getInitiatorCredentials: jest.fn(),
      task: {} as any,
    });

    const file = await fs.readFile(`${workspacePath}/results/result.json`);
    const jsonResult = file.toJSON();

    expect(jsonResult).not.toBeFalsy();
  });
});
