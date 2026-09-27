import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { bootstrap } from "api-server-toolkit/bootstrap";
import {
  Sentry,
  Helmet,
  Cors,
  CookieParser,
  ValidationPipe,
  Log,
  Prefix,
  Swagger,
} from "api-server-toolkit/bootstrap/setup";
import { AppModule } from "@src/app.module";

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Middleware is opt-in — add Passport.setup(app) when you need JWT auth
  Sentry.setup(app);
  Helmet.setup(app);
  Cors.setup(app, true);
  CookieParser.setup(app);
  ValidationPipe.setup(app);
  Log.setup(app);
  Prefix.setup(app);
  Swagger.setup(app);

  await bootstrap(app, { port: 3000 });
}

main();
