import {
  addCalendarDays,
  formatCalendarDate,
  calendarDateAt,
  type CalendarDate,
} from '@mr-booking/shared-date-time';
import {
  OFFICE_TIME_ZONE,
  startOfOfficeWeek as startOfCalendarWeek,
} from '@mr-booking/booking-domain';
import {
  Button,
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from '@mr-booking/shared-ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@mr-booking/shared-i18n';
import { AdaptiveDialogContent } from './adaptive-dialog-content';
import { formatScheduleCalendarDate } from '../formatting/schedule-date-time.formatter';
import type { ScheduleMessages } from '../types/schedule-feature.types';

export function ScheduleWeekDateStrip({
  locale,
  messages,
  selectedDate,
  nowUtc,
  browserTimeZone,
  onSelect,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly selectedDate: CalendarDate;
  readonly nowUtc: number;
  readonly browserTimeZone: string;
  readonly onSelect: (date: CalendarDate) => void;
}) {
  const weekStart = startOfCalendarWeek(selectedDate);
  const selectedKey = formatCalendarDate(selectedDate);
  const todayKey = formatCalendarDate(calendarDateAt(nowUtc, browserTimeZone));
  return (
    <div
      role="group"
      aria-label={messages.mobile.selectedDate}
      className="grid grid-cols-7 gap-1"
    >
      {Array.from({ length: 7 }, (_, index) => {
        const date = addCalendarDays(weekStart, index);
        const key = formatCalendarDate(date);
        const selected = key === selectedKey;
        const today = key === todayKey;
        return (
          <button
            key={key}
            type="button"
            aria-label={`${messages.accessibility.selectDay} ${formatScheduleCalendarDate(date, locale, { dateStyle: 'full' })}`}
            aria-pressed={selected}
            aria-current={today ? 'date' : undefined}
            className={cn(
              'min-h-14 touch-manipulation rounded-lg border px-0.5 py-1 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-transparent bg-card text-foreground hover:bg-accent',
              today && !selected && 'border-primary font-semibold',
            )}
            onClick={() => onSelect(date)}
          >
            <span className="block text-[0.65rem] font-medium uppercase">
              {formatScheduleCalendarDate(date, locale, {
                timeZone: 'UTC',
                weekday: 'short',
              })}
            </span>
            <span className="mt-0.5 block text-sm font-semibold">
              {date.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="min-h-11 min-w-11 shrink-0 touch-manipulation"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SelectedDayHeading({
  locale,
  messages,
  selectedDate,
  browserTimeZone,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly selectedDate: CalendarDate;
  readonly browserTimeZone: string;
}) {
  return (
    <div className="mt-4">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {formatScheduleCalendarDate(selectedDate, locale, {
          dateStyle: 'full',
        })}
      </h1>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {messages.mobile.browserTimezone}: {browserTimeZone}
        </span>
        {browserTimeZone !== OFFICE_TIME_ZONE ? (
          <span>
            {messages.mobile.officeTimezone}: 09:00–19:00 {OFFICE_TIME_ZONE}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ScheduleDatePicker({
  locale,
  messages,
  open,
  selectedDate,
  nowUtc,
  browserTimeZone,
  onOpenChange,
  onSelect,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly open: boolean;
  readonly selectedDate: CalendarDate;
  readonly nowUtc: number;
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (date: CalendarDate) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState({
    year: selectedDate.year,
    month: selectedDate.month,
    day: 1,
  });
  useEffect(() => {
    if (open)
      setVisibleMonth({
        year: selectedDate.year,
        month: selectedDate.month,
        day: 1,
      });
  }, [open, selectedDate]);
  const monthStart = startOfCalendarWeek(visibleMonth);
  const todayKey = formatCalendarDate(calendarDateAt(nowUtc, browserTimeZone));
  const selectedKey = formatCalendarDate(selectedDate);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent closeLabel={messages.close}>
        <DialogHeader>
          <DialogTitle>{messages.mobile.openCalendar}</DialogTitle>
          <DialogDescription>
            {formatScheduleCalendarDate(visibleMonth, locale, {
              month: 'long',
              year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <IconButton
            label={messages.mobile.previousMonth}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </IconButton>
          <strong>
            {formatScheduleCalendarDate(visibleMonth, locale, {
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          <IconButton
            label={messages.mobile.nextMonth}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </IconButton>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="py-2">
              {formatScheduleCalendarDate(
                addCalendarDays(monthStart, index),
                locale,
                { weekday: 'short' },
              )}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }, (_, index) => {
            const date = addCalendarDays(monthStart, index);
            const key = formatCalendarDate(date);
            const inMonth = date.month === visibleMonth.month;
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                aria-label={formatScheduleCalendarDate(date, locale, {
                  dateStyle: 'full',
                })}
                aria-pressed={key === selectedKey}
                aria-current={key === todayKey ? 'date' : undefined}
                className={`min-h-11 rounded-md text-sm ${!inMonth ? 'text-muted-foreground' : ''} ${key === selectedKey ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                onClick={() => onSelect(date)}
              >
                {date.day}
              </Button>
            );
          })}
        </div>
      </AdaptiveDialogContent>
    </Dialog>
  );
}

function addMonths(date: CalendarDate, amount: number): CalendarDate {
  const result = new Date(Date.UTC(date.year, date.month - 1 + amount, 1));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: 1,
  };
}
