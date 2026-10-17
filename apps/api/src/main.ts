import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  const configuredWebUrls = (process.env.WEB_URL || "")
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  const allowedOrigins = [...new Set([...configuredWebUrls, ...defaultOrigins])];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
        /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${cleanOrigin}`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`ValGrow Business OS API running on port ${port}`);
}
bootstrap();
