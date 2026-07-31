import type { WeeklyScheduleViewProps } from './types/schedule-feature.types';
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
} from './components/schedule-states';

export function WeeklyScheduleView({
  locale,
  messages,
  browserTimeZone,
  navigation,
  clock,
  data,
  creation,
  cancellation,
}: WeeklyScheduleViewProps) {
  const scheduleError = data.scheduleError
    ? messages.errors.schedule
    : undefined;
  const roomsError = data.roomsError ? messages.errors.rooms : undefined;
  const dialogError = cancellation.error
    ? errorMessage(cancellation.error, messages)
    : undefined;
  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-screen-2xl overflow-x-clip px-3 py-4 sm:px-6 sm:py-6 lg:py-8"
    >
      <section aria-label={messages.title} className="lg:py-5">
        <div className="sticky top-[4.5rem] z-30 -mx-3 border-b border-border bg-background/95 px-3 pb-3 backdrop-blur-sm sm:top-[4.5rem] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:backdrop-blur-none">
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
          />
        </div>
        {creation.notice === 'created' ? (
          <p
            role="status"
            className="mt-3 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
          >
            {messages.successCreated}
          </p>
        ) : null}
        {cancellation.notice === 'cancelled' ? (
          <p
            role="status"
            className="mt-3 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
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
        ) : data.rooms.length === 0 ? (
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
          <>
            {data.presentation !== 'expanded' ? (
              <SelectedDayHeading
                locale={locale}
                messages={messages}
                selectedDate={navigation.selectedDate}
                browserTimeZone={browserTimeZone}
              />
            ) : null}
            {data.bookings.length === 0 && data.presentation === 'compact' ? (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {messages.mobile.noBookingsForDay}
              </p>
            ) : null}
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
              onSelectSlot={creation.openForSlot}
              onSelectBooking={cancellation.openBooking}
            />
          </>
        ) : null}
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
        error={dialogError}
        onClose={cancellation.closeBooking}
        onRequestConfirmation={cancellation.requestConfirmation}
        onDismissConfirmation={cancellation.dismissConfirmation}
        onConfirmCancellation={cancellation.confirmCancellation}
      />
    </main>
  );
}

function errorMessage(
  kind: NonNullable<WeeklyScheduleViewProps['cancellation']['error']>,
  messages: WeeklyScheduleViewProps['messages'],
): string {
  switch (kind) {
    case 'conflict':
      return messages.errors.conflict;
    case 'past':
      return messages.errors.past;
    case 'outsideOfficeHours':
      return messages.errors.outsideHours;
    case 'invalidDuration':
      return messages.errors.duration;
    case 'validation':
      return messages.errors.validation;
    case 'forbidden':
      return messages.errors.forbidden;
    case 'notFound':
      return messages.errors.notFound;
    default:
      return messages.errors.generic;
  }
}
