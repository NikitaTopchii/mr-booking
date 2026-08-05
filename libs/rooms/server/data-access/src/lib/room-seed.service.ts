import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mr-booking/shared-database';
import { seedRooms } from './room-seed';

@Injectable()
export class RoomSeedService {
  public constructor(private readonly databaseService: DatabaseService) {}

  public seed(): void {
    seedRooms(this.databaseService.connection);
  }
}
