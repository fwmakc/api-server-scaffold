import { bootstrap } from "api-server-toolkit/bootstrap";
import { AppModule } from "@src/app.module";

bootstrap({
  module: AppModule,
  serviceName: "my-service",
  cors: true,
});
