import type { WeeklyScheduleViewProps } from './types/schedule-feature.types';
import { cn } from '@mr-booking/shared-ui';
import { ScheduleToolbar } from './components/schedule-toolbar';
import {
  SelectedDayHeading,
  ScheduleDatePicker,
} from './components/schedule-date-navigation';
import { ScheduleGrid } from './components/schedule-grid';
import { BookingDetailsDialog } from './components/booking-details-dialog';
import { CreateBookingDialog } from './components/create-booking-dialog';
import {
  ScheduleEmptyState,
  ScheduleErrorState,
  ScheduleLoading,
  ScheduleNoMatchingRoomsState,
} from './components/schedule-states';
import { resolveFeatureErrorMessage } from './errors/resolve-schedule-error-message';

export function WeeklyScheduleView({
  locale,
  messages,
  browserTimeZone,
  navigation,
  clock,
  data,
  creation,
  cancellation,
  emailVerified = true,
  onVerificationRequired,
}: WeeklyScheduleViewProps) {
  const compactPresentation = data.presentation === 'compact';
  const roomsError = data.roomsError
    ? resolveFeatureErrorMessage(data.roomsError, messages.errors)
    : undefined;
  const scheduleError = data.scheduleError
    ? resolveFeatureErrorMessage(data.scheduleError, messages.errors)
    : undefined;
  const creationErrorMessage = creation.error
    ? resolveFeatureErrorMessage(creation.error, messages.errors.creation)
    : undefined;
  const cancellationErrorMessage = cancellation.error
    ? resolveFeatureErrorMessage(
        cancellation.error,
        messages.errors.cancellation,
      )
    : undefined;
  return (
    <main
      id="main-content"
      className={cn(
        'mx-auto w-full max-w-screen-2xl overflow-x-clip py-2 md:min-h-[calc(100dvh-var(--app-header-height))] md:py-4 lg:py-5',
        compactPresentation &&
          'flex h-[calc(100dvh-var(--app-header-height)-var(--mobile-navigation-occupied-space))] min-h-0 flex-col overflow-hidden',
      )}
    >
      <section
        aria-label={messages.title}
        className={cn(compactPresentation && 'flex min-h-0 flex-1 flex-col')}
      >
        <div
          data-schedule-standard-content
          className={cn(
            'mx-auto w-full max-w-6xl px-3 sm:px-6',
            compactPresentation && 'flex min-h-0 flex-1 flex-col',
          )}
        >
          <h1 className="sr-only lg:hidden">{messages.title}</h1>
          <div
            className={cn(
              'z-30 -mx-3 bg-background px-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0',
              !compactPresentation &&
                'sticky top-[var(--app-header-height)] border-b border-border pb-2 lg:border-0 lg:pb-0',
              compactPresentation && 'shrink-0',
            )}
          >
            <ScheduleToolbar
              locale={locale}
              messages={messages}
              rooms={data.rooms}
              room={data.selectedRoom}
              schedule={data.presentationRange}
              presentation={data.presentation}
              selectedDate={navigation.selectedDate}
              nowUtc={clock.nowUtc}
              loadingRooms={data.isLoadingRooms}
              browserTimeZone={browserTimeZone}
              onRoomChange={navigation.selectRoom}
              onPrevious={navigation.goToPreviousWeek}
              onCurrent={navigation.goToToday}
              onNext={navigation.goToNextWeek}
              onOpenCalendar={navigation.openCalendar}
              onSelectDate={navigation.selectDate}
              minimumCapacity={navigation.minimumCapacity}
              onApplyCapacity={data.applyMinimumCapacity}
              onClearCapacity={navigation.clearMinimumCapacity}
              loadingSchedule={data.isLoadingSchedule}
              hasScheduleError={scheduleError !== undefined}
              noMatchingRooms={data.noMatchingRooms}
            />
          </div>
          {creation.notice === 'created' ? (
            <p
              role="status"
              className="mt-3 border-y border-border bg-transparent px-1 py-3 text-sm font-medium"
            >
              {messages.successCreated}
            </p>
          ) : null}
          {cancellation.notice === 'cancelled' ? (
            <p
              role="status"
              className="mt-3 border-y border-border bg-transparent px-1 py-3 text-sm font-medium"
            >
              {messages.successCancelled}
            </p>
          ) : null}
          {data.isLoadingRooms || !data.presentation ? (
            <ScheduleLoading
              presentation={data.presentation}
              message={
                data.isLoadingRooms
                  ? messages.loadingRooms
                  : messages.loadingSchedule
              }
            />
          ) : roomsError ? (
            <ScheduleErrorState
              message={roomsError}
              retry={messages.retry}
              onRetry={data.retryRooms}
            />
          ) : data.noMatchingRooms &&
            navigation.minimumCapacity !== undefined ? (
            <ScheduleNoMatchingRoomsState
              message={messages.noMatchingRooms.replace(
                '{capacity}',
                String(navigation.minimumCapacity),
              )}
              clearLabel={messages.clearCapacityFilter}
              onClear={navigation.clearMinimumCapacity}
            />
          ) : !data.hasRooms ? (
            <ScheduleEmptyState message={messages.emptyRooms} />
          ) : scheduleError ? (
            <ScheduleErrorState
              message={scheduleError}
              retry={messages.retry}
              onRetry={data.retrySchedule}
            />
          ) : data.isLoadingSchedule || !data.presentationRange ? (
            <ScheduleLoading
              presentation={data.presentation}
              message={messages.loadingSchedule}
            />
          ) : data.selectedRoom ? (
            <div
              className={cn(
                compactPresentation && 'flex min-h-0 flex-1 flex-col',
              )}
            >
              {data.presentation !== 'expanded' ? (
                <div className="hidden md:block">
                  <SelectedDayHeading
                    locale={locale}
                    messages={messages}
                    selectedDate={navigation.selectedDate}
                    browserTimeZone={browserTimeZone}
                  />
                </div>
              ) : null}
              {data.bookings.length === 0 && data.presentation === 'compact' ? (
                <p className="sr-only" role="status">
                  {messages.mobile.noBookingsForDay}
                </p>
              ) : null}
              <div
                key={data.presentationRange.weekKey}
                data-schedule-wide-breakout
                data-week-transition={navigation.weekTransition}
                className={cn(
                  'schedule-wide-breakout schedule-week-transition',
                  compactPresentation && 'mt-2 flex min-h-0 flex-1 flex-col',
                )}
              >
                <ScheduleGrid
                  locale={locale}
                  messages={messages}
                  schedule={data.presentationRange}
                  presentation={data.presentation}
                  bookings={data.bookings}
                  now={clock.nowUtc}
                  browserTimeZone={browserTimeZone}
                  revalidating={data.isRevalidating}
                  selectedDate={navigation.selectedDate}
                  onSelectSlot={(slot) => {
                    if (!emailVerified) {
                      onVerificationRequired?.();
                      return;
                    }
                    creation.openForSlot(slot);
                  }}
                  onSelectBooking={cancellation.openBooking}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <ScheduleDatePicker
        locale={locale}
        messages={messages}
        open={navigation.calendarOpen}
        selectedDate={navigation.selectedDate}
        nowUtc={clock.nowUtc}
        browserTimeZone={browserTimeZone}
        onOpenChange={navigation.setCalendarOpen}
        onSelect={(date) => {
          navigation.setCalendarOpen(false);
          navigation.selectDate(date);
        }}
      />
      {data.selectedRoom ? (
        <CreateBookingDialog
          locale={locale}
          messages={messages}
          room={data.selectedRoom}
          browserTimeZone={browserTimeZone}
          creation={creation}
          errorMessage={creationErrorMessage}
        />
      ) : null}
      <BookingDetailsDialog
        locale={locale}
        messages={messages}
        booking={cancellation.booking}
        room={data.selectedRoom}
        browserTimeZone={browserTimeZone}
        confirming={cancellation.confirming}
        canCancel={cancellation.canCancel}
        pending={cancellation.pending}
        error={cancellationErrorMessage}
        onClose={cancellation.closeBooking}
        onRequestConfirmation={cancellation.requestConfirmation}
        onDismissConfirmation={cancellation.dismissConfirmation}
        onConfirmCancellation={cancellation.confirmCancellation}
      />
    </main>
  );
}
