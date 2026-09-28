import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { HealthModule } from "api-server-toolkit/health";
import { MetricsModule } from "api-server-toolkit/metrics";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule.forRoot("my-service"),
    MetricsModule.forRoot({ service: "my-service" }),
    // Add your feature modules here
  ],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
