import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger("Bootstrap");
  const prefix = process.env.API_PREFIX ?? "api/v1";

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle("Inventra API")
    .setDescription("Inventory and order management API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  logger.log(`API listening on http://localhost:${port}/${prefix}`);
  logger.log(`Swagger at http://localhost:${port}/docs`);
}

bootstrap();
