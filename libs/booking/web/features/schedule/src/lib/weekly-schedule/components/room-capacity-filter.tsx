import { Button, Input, Label } from '@mr-booking/shared-ui';
import { useEffect, useRef, useState } from 'react';
import { parseMinimumCapacity } from '../model/room-capacity-filter';
import type { RoomCapacityFilterProps } from '../types/schedule-feature.types';

export function RoomCapacityFilter({
  messages,
  minimumCapacity,
  onApply,
  onClear,
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
  }

  return (
    <fieldset
      aria-label={messages.filterButtonLabel}
      className="grid min-w-0 gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:min-w-80 lg:max-w-md"
    >
      <legend className="sr-only">{messages.filterButtonLabel}</legend>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor="schedule-minimum-capacity">
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
          value={draft}
          aria-invalid={showValidationError}
          aria-describedby={showValidationError ? errorId : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setShowValidationError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
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
          type="button"
          className="min-h-11 touch-manipulation"
          disabled={isUnchanged}
          onClick={submit}
        >
          {messages.applyCapacityFilter}
        </Button>
        {minimumCapacity !== undefined ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 touch-manipulation"
            onClick={onClear}
          >
            {messages.clearCapacityFilter}
          </Button>
        ) : null}
      </div>
      {minimumCapacity !== undefined ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground sm:col-span-2"
        >
          <span className="font-medium text-foreground">
            {messages.activeCapacity}
          </span>
          <span>{currentFilterSummary}</span>
        </div>
      ) : null}
    </fieldset>
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
