import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';



import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable CORS for Frontend Access
  app.enableCors();

  // Enable Global Validation Pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have decorators
    transform: true, // Transform payloads to DTO instances
    forbidNonWhitelisted: true, // Throw error if extra properties are present
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
