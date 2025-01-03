import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';
import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  logger,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';

import generator from './generator';
import { StrykerMutatorGeneratorSchema } from './schema';

jest.mock('@nrwl/devkit', () => {
  return {
    ...jest.requireActual('@nrwl/devkit'),
    addDependenciesToPackageJson: jest.fn(),
  };
});
function updateTreeFile(
  tree: Tree,
  path: string,
  callback: (content: string) => string
) {
  tree.write(path, callback(tree.read(path).toString('utf-8')));
}

type TestMatrixItem = {
  name: string;
  case: {
    preset: 'node' | 'angular' | 'nestjs';
  };
};

//FIXME: Fix and create more tests.
describe('stryker-mutator generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyV1Workspace();
  });

  describe('should run successfully', () => {
    const testMatrix: TestMatrixItem[] = [
      {
        name: 'preset: node',
        case: {
          preset: 'node',
        },
      },
      {
        name: 'preset: angular',
        case: {
          preset: 'angular',
        },
      },
      {
        name: 'preset: nestjs',
        case: {
          preset: 'nestjs',
        },
      },
    ];

    testMatrix.forEach((test) => {
      const options: StrykerMutatorGeneratorSchema = {
        names: 'test',
        preset: test.case.preset,
      };

      it(`should run successfully ${test.name}`, async () => {
        updateTreeFile(appTree, 'workspace.json', (content) => {
          const json = JSON.parse(content);
          json.projects['test'] = {
            root: 'apps/test',
            sourceRoot: 'apps/test/src',
            projectType: 'application',
          };
          return JSON.stringify(json);
        });

        await generator(appTree, options);
        const config = readProjectConfiguration(appTree, 'test');
        expect(config).toBeDefined();
      });
    });
  });

  it('should run successfully without root', async () => {
    const options: StrykerMutatorGeneratorSchema = {
      names: 'test',
      preset: 'node',
    };
    updateTreeFile(appTree, 'workspace.json', (content) => {
      const json = JSON.parse(content);
      json.projects['test'] = {
        sourceRoot: 'apps/test/src',
        projectType: 'application',
      };
      return JSON.stringify(json);
    });

    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });

  it('log error if source and root is not given', async () => {
    const projectName = 'test';
    const options: StrykerMutatorGeneratorSchema = {
      names: projectName,
      preset: 'node',
    };
    updateTreeFile(appTree, 'workspace.json', (content) => {
      const json = JSON.parse(content);
      json.projects[projectName] = {
        projectType: 'application',
      };
      return JSON.stringify(json);
    });

    const spyError = jest.spyOn(logger, 'error');

    generator(appTree, options);
    expect(spyError).toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledWith(
      `Could not generate files for project ${projectName}`
    );
  });

  it('should run install dependencies', async () => {
    // mock
    const mockedAddDependenciesToPackageJson = jest.mocked(
      addDependenciesToPackageJson
    );
    const mockedInstallTask = jest.fn();
    mockedAddDependenciesToPackageJson.mockImplementation(
      (tree: any, options: any): GeneratorCallback => {
        return mockedInstallTask;
      }
    );

    // Arrange
    const options: StrykerMutatorGeneratorSchema = {
      names: 'test',
      preset: 'node',
    };

    updateTreeFile(appTree, 'workspace.json', (content) => {
      const json = JSON.parse(content);
      json.projects['test'] = {
        root: 'apps/test',
        sourceRoot: 'apps/test/src',
        projectType: 'application',
      };
      return JSON.stringify(json);
    });

    // Act
    (await generator(appTree, options))();
    const config = readProjectConfiguration(appTree, 'test');

    // Assert
    expect(mockedAddDependenciesToPackageJson).toHaveBeenCalled();
    expect(config).toBeDefined();
  });
});
