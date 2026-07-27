import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseService } from './database.service';
import { SqliteHealthIndicator } from './sqlite-health.indicator';

@Global()
@Module({
  imports: [TerminusModule],
  providers: [DatabaseService, SqliteHealthIndicator],
  exports: [DatabaseService, SqliteHealthIndicator],
})
export class DatabaseModule {}
