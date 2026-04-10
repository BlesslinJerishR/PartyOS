import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 1048576, // 1MB
      caseSensitive: true,
      ignoreTrailingSlash: true,
    }),
  );

  // Security headers via Helmet
  await app.register(helmet, {
    contentSecurityPolicy: false, // Mobile API — CSP not applicable
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => {
          const constraints = e.constraints
            ? Object.values(e.constraints)
            : ['Invalid value'];
          return `${e.property}: ${constraints.join(', ')}`;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  const configService = app.get(ConfigService);

  // CORS: restrict to configured origins or allow all in development
  const allowedOrigins = configService.get<string>('CORS_ORIGINS', '');
  app.enableCors({
    origin: allowedOrigins
      ? allowedOrigins.split(',').map((o) => o.trim())
      : true,
    credentials: true,
    maxAge: 86400,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port, '0.0.0.0');
  console.log(`PartyOS API running on port ${port}`);
}
bootstrap();
