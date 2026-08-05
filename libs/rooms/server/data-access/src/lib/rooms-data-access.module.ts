import { Module } from '@nestjs/common';
import { ROOM_READER } from '@mr-booking/rooms-domain';
import { DatabaseService } from '@mr-booking/shared-database';
import { DrizzleRoomReader } from './room-reader';
import { RoomSeedService } from './room-seed.service';

@Module({
  providers: [
    RoomSeedService,
    {
      provide: DrizzleRoomReader,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) =>
        new DrizzleRoomReader(databaseService),
    },
    {
      provide: ROOM_READER,
      useExisting: DrizzleRoomReader,
    },
  ],
  exports: [RoomSeedService, ROOM_READER],
})
export class RoomsDataAccessModule {}
