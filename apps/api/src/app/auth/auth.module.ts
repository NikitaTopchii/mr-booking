import { Module } from '@nestjs/common';
import { AuthFeatureModule } from '@mr-booking/auth-feature';
import { AuthController } from './auth.controller';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionCookieService } from './session-cookie.service';

@Module({
  imports: [AuthFeatureModule],
  controllers: [AuthController],
  providers: [SessionCookieService, SessionAuthGuard],
  exports: [SessionAuthGuard],
})
export class AuthModule {}
