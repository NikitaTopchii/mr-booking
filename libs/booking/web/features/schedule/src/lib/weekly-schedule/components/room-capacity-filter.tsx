import { Button, Input, Label } from '@mr-booking/shared-ui';
import { useEffect, useRef, useState } from 'react';
import { parseMinimumCapacity } from '../model/room-capacity-filter';
import type { RoomCapacityFilterProps } from '../types/schedule-feature.types';

export function RoomCapacityFilter({
  messages,
  minimumCapacity,
  onApply,
  onClear,
  onApplied,
  onCleared,
}: RoomCapacityFilterProps) {
  const [draft, setDraft] = useState(
    minimumCapacity === undefined ? '' : String(minimumCapacity),
  );
  const [showValidationError, setShowValidationError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = 'schedule-capacity-error';
  const currentFilterSummary = formatCapacityMessage(
    messages.currentFilterSummary,
    minimumCapacity,
  );

  useEffect(() => {
    setDraft(minimumCapacity === undefined ? '' : String(minimumCapacity));
    setShowValidationError(false);
  }, [minimumCapacity]);

  const parsedDraft = parseMinimumCapacity(draft);
  const isUnchanged =
    parsedDraft === minimumCapacity &&
    (minimumCapacity !== undefined || draft === '');

  function submit(): void {
    if (parsedDraft === undefined) {
      setShowValidationError(true);
      inputRef.current?.focus();
      return;
    }

    setShowValidationError(false);
    onApply(parsedDraft);
    onApplied?.(parsedDraft);
  }

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <fieldset
        aria-label={messages.filterButtonLabel}
        data-schedule-capacity-filter
        className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-3"
      >
        <legend className="sr-only">{messages.filterButtonLabel}</legend>
        <div className="grid min-w-0 gap-1">
          <Label
            htmlFor="schedule-minimum-capacity"
            className="block text-xs leading-4 text-muted-foreground"
          >
            {messages.minimumCapacityLabel}
          </Label>
          <Input
            ref={inputRef}
            id="schedule-minimum-capacity"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder={messages.minimumCapacityPlaceholder}
            className="bg-card"
            value={draft}
            aria-invalid={showValidationError}
            aria-describedby={showValidationError ? errorId : undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setShowValidationError(false);
            }}
          />
          {showValidationError ? (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {messages.invalidCapacity}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            className="min-h-11 touch-manipulation border border-primary bg-primary text-primary-foreground hover:border-secondary hover:bg-secondary disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground"
            disabled={isUnchanged}
          >
            {messages.applyCapacityFilter}
          </Button>
          {minimumCapacity !== undefined ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={() => {
                onClear();
                onCleared?.();
              }}
            >
              {messages.clearCapacityFilter}
            </Button>
          ) : null}
        </div>
        {minimumCapacity !== undefined ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground sm:col-span-2"
          >
            <span className="font-medium text-foreground">
              {messages.activeCapacity}
            </span>
            <span>{currentFilterSummary}</span>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

function formatCapacityMessage(
  message: string,
  minimumCapacity: number | undefined,
): string {
  return minimumCapacity === undefined
    ? message
    : message.replace('{capacity}', String(minimumCapacity));
}
