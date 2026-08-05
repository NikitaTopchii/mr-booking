import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { bookingSlots, bookings } from './booking-schema';

describe('booking persistence schema', () => {
  it('preserves the booking table metadata', () => {
    const config = getTableConfig(bookings);

    expect(config.name).toBe('bookings');
    expect(config.columns.map((column) => column.name)).toEqual([
      'id',
      'room_id',
      'author_user_id',
      'title',
      'starts_at_utc',
      'ends_at_utc',
      'created_at_utc',
      'cancelled_at_utc',
    ]);
    expect(config.indexes.map((index) => index.config.name)).toEqual([
      'bookings_active_room_start_index',
      'bookings_active_author_start_index',
    ]);
    expect(config.checks).toHaveLength(7);
    expect(config.foreignKeys).toHaveLength(2);
  });

  it('preserves the booking-slot table metadata', () => {
    const config = getTableConfig(bookingSlots);

    expect(config.name).toBe('booking_slots');
    expect(config.columns.map((column) => column.name)).toEqual([
      'booking_id',
      'room_id',
      'slot_starts_at_utc',
    ]);
    expect(config.indexes.map((index) => index.config.name)).toEqual([
      'booking_slots_room_slot_unique',
    ]);
    expect(config.indexes[0]?.config.unique).toBe(true);
    expect(
      config.primaryKeys.map((primaryKey) => primaryKey.getName()),
    ).toEqual(['booking_slots_booking_slot_primary']);
    expect(config.checks).toHaveLength(1);
    expect(config.foreignKeys).toHaveLength(2);
  });
});
