import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';
import { readProjectConfiguration, Tree } from '@nrwl/devkit';

import generator from './generator';
import { StrykerMutatorGeneratorSchema } from './schema';

function updateTreeFile(
  tree: Tree,
  path: string,
  callback: (content: string) => string
) {
  tree.write(path, callback(tree.read(path).toString('utf-8')));
}

//FIXME: Fix and create more tests.
describe('stryker-mutator generator', () => {
  let appTree: Tree;
  const options: StrykerMutatorGeneratorSchema = {
    names: 'test',
    preset: 'angular',
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyV1Workspace();

    updateTreeFile(appTree, 'workspace.json', (content) => {
      const json = JSON.parse(content);
      json.projects['test'] = {
        root: 'apps/test',
        sourceRoot: 'apps/test/src',
        projectType: 'application',
      };
      return JSON.stringify(json);
    });
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
