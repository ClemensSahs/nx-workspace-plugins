import executor from './executor';
import { loadStrykerConfig } from './helper';
import { ExecutorContext } from '@nrwl/devkit';
import { execSync, ExecSyncOptions } from 'child_process';
import { transpileModule } from 'typescript';
import exp = require('constants');
import { existsSync } from 'fs';
import path = require('path');

// mocks
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
}));

jest.mock('typescript', () => ({
  transpileModule: jest.fn(),
}));

jest.mock('./helper', () => {
  return {
    loadStrykerConfig: jest.fn(),
  };
});

const mockedExecSync = jest.mocked(execSync, true);
const mockedTranspileModule = jest.mocked(transpileModule, true);
const mockedLoadStrykerConfig = jest.mocked(loadStrykerConfig, true);

const mockedExistsSync = jest.mocked(existsSync, true);

type TestMatrixItem = {
  case: {
    name: string;
    mutate: string;
    incremental: boolean;
    strykerConfig: string;
  };
  expected: {
    command: {
      containMutate: boolean;
      containIncremental: boolean;
    };
    strykerConfigPath: string;
    output?: {
      success: boolean;
    };
  };
};

//FIXME: Fix and create more tests.
describe('Build Executor', () => {
  const context: ExecutorContext = {
    root: '',
  } as ExecutorContext;
  const currentBaseDir = path.resolve(context.root);

  beforeAll(() => {
    jest.clearAllMocks();
  });

  const testMatrix: TestMatrixItem[] = [
    {
      case: {
        name: 'no incremental, no mutate, no stryker config',
        incremental: false,
        mutate: '',
        strykerConfig: '',
      },
      expected: {
        command: {
          containIncremental: false,
          containMutate: false,
        },
        strykerConfigPath: `${currentBaseDir}`,
        output: {
          success: true,
        },
      },
    },
    {
      case: {
        name: 'with incremental, with mutate, with stryker config',
        incremental: true,
        mutate: './src/**/*.ts',
        // strykerConfig: '',
        strykerConfig: './stryker.conf.js',
      },
      expected: {
        command: {
          containIncremental: true,
          containMutate: true,
        },
        strykerConfigPath: `${currentBaseDir}/stryker.conf.js`,
        output: {
          success: true,
        },
      },
    },
  ];
  testMatrix.forEach((testMatrixItem: TestMatrixItem) => {
    it(`can run it simple ${testMatrixItem.case.name}`, async () => {
      // Arrange
      let receivedStrykerConfigPath;
      mockedLoadStrykerConfig.mockImplementationOnce(
        async (strykerConfigPath: string) => {
          receivedStrykerConfigPath = strykerConfigPath;
          return {};
        }
      );

      let receivedExecSyncCommand;
      mockedExecSync.mockImplementationOnce(
        (command: string, options?: ExecSyncOptions): string => {
          receivedExecSyncCommand = command;
          return '';
        }
      );

      mockedExistsSync.mockImplementationOnce((path: string) => {
        return false;
      });

      // Act
      const output = await executor(
        {
          mutate: testMatrixItem.case.mutate,
          incremental: testMatrixItem.case.incremental,
          strykerConfig: testMatrixItem.case.strykerConfig,
        },
        context
      );

      // Assert
      if (testMatrixItem.case.strykerConfig) {
        expect(receivedStrykerConfigPath).toEqual(
          testMatrixItem.expected.strykerConfigPath
        );
      }

      expect(receivedExecSyncCommand).toContain('npx stryker run ');
      if (testMatrixItem.expected.command.containIncremental) {
        expect(receivedExecSyncCommand).toContain('--incremental');
      } else {
        expect(receivedExecSyncCommand).not.toContain('--incremental');
      }

      if (testMatrixItem.expected.command.containMutate) {
        expect(receivedExecSyncCommand).toContain('--mutate');
      } else {
        expect(receivedExecSyncCommand).not.toContain('--mutate');
      }

      expect(mockedTranspileModule).not.toHaveBeenCalled();

      expect(mockedLoadStrykerConfig).toHaveBeenCalled();

      expect(mockedExecSync).toHaveBeenCalled();
      expect(output).toEqual(testMatrixItem.expected.output);
    });
  });
});
