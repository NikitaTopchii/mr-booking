import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RoomSeedService } from '@mr-booking/rooms-data-access';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';

@Injectable()
export class FoundationStartupService implements OnApplicationBootstrap {
  public constructor(private readonly roomSeedService: RoomSeedService) {}

  public onApplicationBootstrap(): void {
    const environment = parseRuntimeEnvironment(process.env);

    if (environment.SEED_ON_START) {
      this.roomSeedService.seed();
    }
  }
}
