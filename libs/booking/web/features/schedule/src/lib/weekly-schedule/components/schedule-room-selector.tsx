import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mr-booking/shared-ui';
import { MapPin, Users } from 'lucide-react';
import type { ScheduleRoomSelectorProps } from '../types/schedule-feature.types';

export function ScheduleRoomSelector({
  messages,
  rooms,
  room,
  loading,
  onChange,
}: ScheduleRoomSelectorProps) {
  return (
    <div className="w-full lg:max-w-[18rem]">
      <Label
        htmlFor="schedule-room"
        className="block text-xs leading-4 text-muted-foreground"
      >
        {messages.roomLabel}
      </Label>
      <Select
        value={room?.id ?? ''}
        disabled={loading || rooms.length === 0}
        onValueChange={onChange}
      >
        <SelectTrigger
          id="schedule-room"
          aria-label={messages.mobile.selectRoom}
          className="mt-1 bg-card"
        >
          <SelectValue placeholder={messages.loadingRooms} />
        </SelectTrigger>
        <SelectContent>
          {rooms.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {room ? (
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            {messages.mobile.floor} {room.floor}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5" />
            {room.capacity} {messages.mobile.capacity}
          </span>
        </p>
      ) : null}
    </div>
  );
}
