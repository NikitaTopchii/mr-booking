import * as config from './index';

describe('shared-config public entrypoints', () => {
  it('keeps the root entrypoint runtime-neutral', () => {
    expect(config.parseRuntimeEnvironment).toEqual(expect.any(Function));
    expect(config).not.toHaveProperty('loadRootEnvironmentFile');
    expect(config).not.toHaveProperty('loadEnvironmentFile');
  });
});
