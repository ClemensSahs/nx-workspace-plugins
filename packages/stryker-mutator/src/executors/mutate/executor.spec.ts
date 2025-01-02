import executor from './executor';
import { loadStrykerConfig } from './helper';
import { ExecutorContext } from '@nrwl/devkit';
import { execSync, ExecSyncOptions } from 'child_process';
import { transpileModule } from 'typescript';
import exp = require('constants');
import { existsSync } from 'fs';

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

const context: ExecutorContext = {
  root: '',
} as ExecutorContext;

//FIXME: Fix and create more tests.
describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(
      { mutate: '', incremental: true, strykerConfig: '' },
      context
    );

    mockedLoadStrykerConfig.mockImplementation(
      async (strykerConfigPath: string) => {
        expect(strykerConfigPath).toEqual('');
        return {};
      }
    );

    mockedExecSync.mockImplementation(
      (command: string, options?: ExecSyncOptions): string => {
        expect(options).toEqual({ stdio: [0, 1, 2] });

        expect(command).toContain('stryker run');
        expect(command).toContain('--incremental');
        expect(command).not.toContain('--mutate');
        return '';
      }
    );

    mockedExistsSync.mockImplementation((path: string) => {
      return false;
    });

    expect(mockedTranspileModule).not.toHaveBeenCalled();

    expect(mockedLoadStrykerConfig).toHaveBeenCalled();

    expect(mockedExecSync).toHaveBeenCalled();
    expect(output).toEqual({ success: true });
  });
});
