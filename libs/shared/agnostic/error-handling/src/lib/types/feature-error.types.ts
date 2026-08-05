export type FeatureErrorSeverity = 'info' | 'warning' | 'error';

export type FeatureErrorContext = Readonly<Record<string, unknown>>;

export interface FeatureError<
  Code extends string,
  MessageKey extends string,
  Feature extends string,
  Operation extends string,
  Context extends object,
> {
  readonly code: Code;
  readonly messageKey: MessageKey;
  readonly feature: Feature;
  readonly operation: Operation;
  readonly occurredAtUtc: number;
  readonly severity: FeatureErrorSeverity;
  readonly retryable: boolean;
  readonly telemetryCode: string;
  readonly context: Context;
  readonly requestId?: string;
}

export type ReportableFeatureError = FeatureError<
  string,
  string,
  string,
  string,
  FeatureErrorContext
>;

export interface FeatureErrorCatalogEntry<MessageKey extends string> {
  readonly messageKey: MessageKey;
  readonly severity: FeatureErrorSeverity;
  readonly retryable: boolean;
  readonly telemetryCode: string;
}

export type FeatureErrorCatalog<MessageKey extends string> = Readonly<
  Record<string, FeatureErrorCatalogEntry<MessageKey>>
>;

export interface FeatureErrorClock {
  nowUtc(): number;
}

export interface FeatureErrorReporter {
  report(error: ReportableFeatureError, cause?: unknown): void;
}

export type FeatureErrorFactoryInput<
  Code extends string,
  Context extends object,
> = {
  readonly code: Code;
  readonly context: Context;
  readonly cause?: unknown;
  readonly requestId?: string;
};

export interface FeatureErrorFactory<
  Feature extends string,
  Operation extends string,
  Catalog extends FeatureErrorCatalog<string>,
  Context extends object,
> {
  create<Code extends keyof Catalog & string>(
    input: FeatureErrorFactoryInput<Code, Context>,
  ): FeatureError<
    Code,
    Catalog[Code]['messageKey'],
    Feature,
    Operation,
    Context
  >;
}
