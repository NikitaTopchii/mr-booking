import type { OnApplicationBootstrap } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuthSeedService } from '@mr-booking/auth-data-access';
import { DemoBookingSeedService } from '@mr-booking/booking-data-access';
import { RoomSeedService } from '@mr-booking/rooms-data-access';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';

@Injectable()
export class FoundationStartupService implements OnApplicationBootstrap {
  public constructor(
    private readonly roomSeedService: RoomSeedService,
    private readonly authSeedService: AuthSeedService,
    private readonly demoBookingSeedService: DemoBookingSeedService,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    const environment = parseRuntimeEnvironment(process.env);

    if (environment.SEED_ON_START) {
      this.roomSeedService.seed();
      await this.authSeedService.seed();
      this.demoBookingSeedService.seed(environment.DEMO_SEED_WEEK_START);
    }
  }
}
