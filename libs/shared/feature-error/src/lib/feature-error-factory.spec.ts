import {
  createFeatureErrorFactory,
  type FeatureErrorCatalog,
  type FeatureErrorClock,
  type FeatureErrorReporter,
} from '../index';

const catalog = {
  service: {
    messageKey: 'service',
    severity: 'error',
    retryable: true,
    telemetryCode: 'test.service',
  },
  rejected: {
    messageKey: 'rejected',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'test.rejected',
  },
} as const satisfies FeatureErrorCatalog<'service' | 'rejected'>;

describe('createFeatureErrorFactory', () => {
  it('applies catalog metadata, injected time, context, and reporter', () => {
    const clock: FeatureErrorClock = { nowUtc: () => 1234 };
    const report = jest.fn();
    const reporter: FeatureErrorReporter = { report };
    const factory = createFeatureErrorFactory({
      feature: 'testFeature',
      operation: 'testOperation',
      catalog,
      clock,
      reporter,
    });

    const cause = new Error('internal detail');
    const error = factory.create({
      code: 'rejected',
      context: { entityId: 'entity-1' },
      cause,
      requestId: 'request-1',
    });

    expect(error).toEqual({
      code: 'rejected',
      messageKey: 'rejected',
      feature: 'testFeature',
      operation: 'testOperation',
      occurredAtUtc: 1234,
      severity: 'warning',
      retryable: false,
      telemetryCode: 'test.rejected',
      context: { entityId: 'entity-1' },
      requestId: 'request-1',
    });
    expect(Object.isFrozen(error)).toBe(true);
    expect(Object.isFrozen(error.context)).toBe(true);
    expect(report).toHaveBeenCalledWith(error, cause);
  });

  it('omits an absent request id instead of fabricating one', () => {
    const factory = createFeatureErrorFactory({
      feature: 'testFeature',
      operation: 'testOperation',
      catalog,
      clock: { nowUtc: () => 1 },
      reporter: { report: jest.fn() },
    });

    expect(factory.create({ code: 'service', context: {} })).not.toHaveProperty(
      'requestId',
    );
  });
});
