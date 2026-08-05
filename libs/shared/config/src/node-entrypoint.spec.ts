import * as nodeConfig from './node';

describe('shared-config Node entrypoint', () => {
  it('owns environment-file loading', () => {
    expect(nodeConfig.loadRootEnvironmentFile).toEqual(expect.any(Function));
  });
});
