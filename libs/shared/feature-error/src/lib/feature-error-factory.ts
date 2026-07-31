import type {
  FeatureError,
  FeatureErrorCatalog,
  FeatureErrorClock,
  FeatureErrorFactory,
  FeatureErrorFactoryInput,
  FeatureErrorReporter,
  ReportableFeatureError,
} from './types/feature-error.types';

export const systemFeatureErrorClock: FeatureErrorClock = {
  nowUtc: () => Date.now(),
};

export const defaultFeatureErrorReporter: FeatureErrorReporter = {
  report(error) {
    if (process.env['NODE_ENV'] === 'production') return;
    console.warn('[feature-error]', {
      code: error.code,
      feature: error.feature,
      operation: error.operation,
      occurredAtUtc: error.occurredAtUtc,
      severity: error.severity,
      retryable: error.retryable,
      telemetryCode: error.telemetryCode,
      context: error.context,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    });
  },
};

export function createFeatureErrorFactory<
  Feature extends string,
  Operation extends string,
  Catalog extends FeatureErrorCatalog<string>,
  Context extends object,
>({
  feature,
  operation,
  catalog,
  clock,
  reporter,
}: {
  readonly feature: Feature;
  readonly operation: Operation;
  readonly catalog: Catalog;
  readonly clock: FeatureErrorClock;
  readonly reporter: FeatureErrorReporter;
}): FeatureErrorFactory<Feature, Operation, Catalog, Context> {
  return {
    create<Code extends keyof Catalog & string>({
      code,
      context,
      cause,
      requestId,
    }: FeatureErrorFactoryInput<Code, Context>): FeatureError<
      Code,
      Catalog[Code]['messageKey'],
      Feature,
      Operation,
      Context
    > {
      const metadata = catalog[code];
      if (!metadata) {
        throw new Error(`Missing feature error catalog entry: ${code}`);
      }
      const error = Object.freeze({
        code,
        messageKey: metadata.messageKey,
        feature,
        operation,
        occurredAtUtc: clock.nowUtc(),
        severity: metadata.severity,
        retryable: metadata.retryable,
        telemetryCode: metadata.telemetryCode,
        context: Object.freeze({ ...context }),
        ...(requestId ? { requestId } : {}),
      }) as FeatureError<
        Code,
        Catalog[Code]['messageKey'],
        Feature,
        Operation,
        Context
      >;

      reporter.report(error as ReportableFeatureError, cause);
      return error;
    },
  };
}
