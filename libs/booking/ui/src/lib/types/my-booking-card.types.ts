export interface MyBookingCardMessages {
  readonly openSchedule: string;
  readonly cancel: string;
  readonly floor: string;
  readonly capacity: string;
  readonly statuses: {
    readonly UPCOMING: string;
    readonly IN_PROGRESS: string;
    readonly PAST: string;
  };
}

export interface MyBookingCardProps {
  readonly booking: {
    readonly id: string;
    readonly title: string;
    readonly startsAtUtc: string;
    readonly endsAtUtc: string;
    readonly room: {
      readonly name: string;
      readonly floor: number;
      readonly capacity: number;
    };
    readonly status: 'UPCOMING' | 'IN_PROGRESS' | 'PAST';
    readonly canCancel: boolean;
  };
  readonly href: string;
  readonly locale: string;
  readonly browserTimeZone: string;
  readonly messages: MyBookingCardMessages;
  readonly onCancel?: () => void;
}
