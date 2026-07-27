import { Module } from '@nestjs/common';
import { RoomSeedService } from './room-seed.service';

@Module({
  providers: [RoomSeedService],
  exports: [RoomSeedService],
})
export class RoomsDataAccessModule {}
