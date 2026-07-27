import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { loadRootEnvironmentFile } from '@mr-booking/shared-config/node';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  loadRootEnvironmentFile();
  const environment = parseRuntimeEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableShutdownHooks();

  Logger.log(
    JSON.stringify({
      event: 'api.starting',
      port: environment.API_INTERNAL_PORT,
      nodeEnvironment: environment.NODE_ENV,
    }),
    'Bootstrap',
  );

  await app.listen(environment.API_INTERNAL_PORT, '0.0.0.0');

  Logger.log(
    JSON.stringify({
      event: 'api.started',
      url: `http://0.0.0.0:${environment.API_INTERNAL_PORT}/api`,
    }),
    'Bootstrap',
  );
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Logger.error(
    JSON.stringify({ event: 'api.start_failed', message }),
    undefined,
    'Bootstrap',
  );
  process.exitCode = 1;
});
