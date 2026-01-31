import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '@app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.get<string>('API_PREFIX') || 'api');

  app.enableCors({
    origin: (configService.get<string>('CORS_ORIGINS') || '').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
