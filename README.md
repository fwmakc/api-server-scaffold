# API Server Scaffold — Microservice Template

[![Version](https://img.shields.io/badge/version-v0.1.0-blue)](https://github.com/fwmakc/api-server-scaffold/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/fwmakc/api-server-scaffold/blob/master/LICENSE)

> Reference implementation: 5-minute bootstrap — create a new microservice on the toolkit.
> Clone, rename, add your domain logic, deploy.

## What This Is

A **working scaffold** — not a demo, not a toy. Everything is wired up:
`bootstrap()` startup, `HealthModule`, Sentry, helmet, ValidationPipe, Swagger,
graceful shutdown. You add entities and controllers — the boring infrastructure
is already done.

`main.ts` is 25 lines — every middleware is opt-in, explicit and readable:

```typescript
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { bootstrap } from "api-server-toolkit/bootstrap";
import {
  Sentry, Helmet, Cors, CookieParser, ValidationPipe, Log, Prefix, Swagger,
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
```

## Pattern

This repo demonstrates the **bootstrap pattern** in the toolkit stack:

- **`main.ts` is explicit** — `bootstrap()` handles listen + graceful shutdown, named `.setup(app)` utilities handle middleware
- **Everything wired** — HealthModule, CORS, Swagger UI, ReDoc, tsconfig paths
- **No boilerplate** — `nest new` gives you empty project; scaffold gives you production-ready service

Use this when you need: a new microservice that doesn't fit existing patterns.

## Quick Start

```bash
git clone https://github.com/fwmakc/api-server-scaffold.git my-service
cd my-service
# rename the package
npm pkg set name=my-service
npm install
cp .env.example .env
npm run dev
```

- Health check: `GET http://localhost:3000/health`
- Swagger UI: `GET http://localhost:3000/swagger`
- ReDoc: `GET http://localhost:3000/redoc`

## What's Inside

| File | Purpose |
|------|---------|
| `src/main.ts` | Explicit middleware setup + `bootstrap()` |
| `src/app.module.ts` | `HealthModule.forRoot()` + your feature modules |
| `package.json` | `api-server-toolkit#v0.16.0`, jest, nest CLI |
| `Dockerfile` | node:22-alpine, multi-stage, HEALTHCHECK |
| `tsconfig.json` | `@src/*` path alias, incremental, skipLibCheck |
| `.env.example` | Minimal config — DB, Swagger, Sentry |

## Adding Your First Entity

```typescript
// src/products/products.entity.ts
import { Entity } from 'typeorm';
import { IdColumn, VarcharColumn, CommonColumn } from 'api-server-toolkit';

@Entity('products')
export class ProductEntity extends CommonColumn {
  @IdColumn() id: number;
  @VarcharColumn() name: string;
}
```

```typescript
// src/products/products.controller.ts
import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { ProductEntity } from './products.entity';

// Access model (AccessRule): operation = rules array (OR), default deny.
// who: 'public' = anonymous, 'authenticated' = any logged-in user, real roles otherwise.
@Controller('products')
export class ProductController extends EntityController({
  name: 'products',
  entity: ProductEntity,
  operations: {
    read: [{ who: ['public'] }],          // anonymous can read
    create: [{ who: ['authenticated'] }], // logged-in can create
    delete: [{ who: ['superuser'] }],     // superuser only
  },
})<any, ProductEntity, any> {
  constructor(readonly service: any) { super(); }
}
```

Register in `app.module.ts`, restart — `GET /products/find` works.

## Adding a Complete CRUD Module (5 minutes)

Full pattern: Entity → DTO → Service → Controller → Module.

### 1. Entity

```typescript
// src/products/products.entity.ts
import { Entity } from 'typeorm';
import { IdColumn, VarcharColumn, TextColumn, CommonColumn } from 'api-server-toolkit';

@Entity('products')
export class ProductEntity extends CommonColumn {
  @IdColumn() id: number;
  @VarcharColumn() name: string;
  @TextColumn() description: string;
}
```

### 2. DTO

```typescript
// src/products/products.dto.ts
import { DtoColumn, CommonDto } from 'api-server-toolkit';

export class ProductDto extends CommonDto {
  @DtoColumn() name: string;
  @DtoColumn() description: string;
}
```

### 3. Service

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'api-server-toolkit';
import { ProductDto } from './products.dto';
import { ProductEntity } from './products.entity';

@Injectable()
export class ProductService extends CommonService<ProductDto, ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity)
    protected readonly repository: Repository<ProductEntity>,
  ) {
    super();
  }
}
```

### 4. Controller

```typescript
// src/products/products.controller.ts
import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { ProductDto } from './products.dto';
import { ProductEntity } from './products.entity';
import { ProductService } from './products.service';

// The service adds @Controller itself; EntityController is used in extends style.
@Controller('products')
export class ProductController extends EntityController({
  name: 'products',
  dto: ProductDto,
  entity: ProductEntity,
  operations: {
    // Rows outside the scope return 404, rule not matched → 403.
    read: [
      { who: ['public'], filter: { isPublished: true } }, // anonymous: published only
      { who: ['authenticated'] },                          // logged-in: everything
    ],
    create: [{ who: ['authenticated'] }],
    update: [{ who: ['authenticated'] }],
    delete: [{ who: ['superuser'] }],
  },
  // Field rules: response — strip from server responses, request — strip from incoming payload.
  fields: {
    internalNotes: { response: [{ who: ['superuser'] }] },
  },
})<ProductDto, ProductEntity, ProductService> {
  constructor(readonly service: ProductService) {
    super();
  }
}
```

**Owner scope** (optional): if the entity has an `account` relation, you can
restrict rows to their owner — `scope: { owner: 'account.id' }` filters
reads/updates to own rows and stamps `account.id` on create (client value is
ignored):

```typescript
create: [{ who: ['authenticated'], scope: { owner: 'account.id' } }],
update: [{ who: ['authenticated'], scope: { owner: 'account.id' } }, { who: ['superuser'] }],
```

A role entry with `tenant: 'all'` (from auth-server `roleEntries`) widens any
scope. Dot-paths work for nested owners too: `scope: { owner: 'author.id' }`.

### 5. Module

```typescript
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './products.entity';
import { ProductService } from './products.service';
import { ProductController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductsModule {}
```

### 6. Register

```typescript
// src/app.module.ts
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    HealthModule.forRoot('my-service'),
    TypeOrmModule.forRootAsync({ ... }),
    ProductsModule,  // ← add here
  ],
})
export class AppModule {}
```

Restart — you now have:
- `GET /products/find`, `/products/find/:id`, `/products/count` — public read (published only for anonymous)
- `POST /products/create` — authenticated users
- `PATCH /products/update/:id` — authenticated users
- `DELETE /products/remove/:id` — superuser only
- `internalNotes` is stripped from responses for everyone except superuser
- `GET /swagger` — interactive docs

### Adding to Docker Compose

```yaml
# gateway-server/docker-compose.yml
my-service:
  build:
    context: ..
    dockerfile: my-service/Dockerfile
  environment:
    - NODE_ENV=production
    - SERVICE_NAME=my-service
    - PORT=3006
    - DB_TYPE=postgres
    - DB_HOST=pgbouncer
    - DB_PORT=5432
    - DB_NAME=my_service
    - DB_USER=${DB_USER:-root}
    - DB_PASSWORD=${DB_PASSWORD:-1234}
    - INTERNAL_API_KEY=${INTERNAL_API_KEY:-changeme}
  depends_on:
    pgbouncer:
      condition: service_healthy
  networks:
    - frontend
    - backend
  restart: unless-stopped
```

Add a database in `init-databases.sh`:
```bash
CREATE DATABASE my_service;
```

Add nginx routing in `nginx.conf`:
```nginx
upstream my_service_backend {
    zone my_service_backend 64k;
    least_conn;
    server my-service:3006 resolve max_fails=3 fail_timeout=30s;
}

location /products {
    proxy_pass http://my_service_backend;
    include /etc/nginx/conf.d/proxy.conf;
}
```

## AI-Friendly Documentation

This template is designed for AI-assisted development.

### ai-context.md
Run `npm run ai-context` to generate a structured reference of your service
(controllers, routes, services, entities, DTOs). Feed it to any LLM
(ChatGPT, Claude, Cursor, Copilot) for context-aware code generation.

### Swagger UI
Interactive API exploration at `/swagger` — test endpoints live.

### ReDoc
Clean, readable documentation at `/redoc`.

### Why this matters
An LLM with `ai-context.md` + `ai-declarations.md` (from the toolkit) can
generate correct entities, controllers, and services that follow all
conventions — without reading the entire codebase.

## Backend-Only — Bring Your Own Frontend

This template provides a complete backend service. No frontend included.

All APIs are REST + JSON, fully documented via Swagger/ReDoc. Build your
frontend in React, Vue, Next.js, mobile — anything that speaks HTTP.

## Integration With the Stack

This scaffold is part of a microservices stack:

| Service | Role | Port |
|---------|------|------|
| [auth-server](https://github.com/fwmakc/auth-server) | OAuth2, JWT RS256 | 3001 |
| [api-server](https://github.com/fwmakc/api-server) | Domain CRUD | 5000 |
| [event-server](https://github.com/fwmakc/event-server) | Webhook event broker | 3005 |
| [file-server](https://github.com/fwmakc/file-server) | File upload + resize | 3002 |
| [message-server](https://github.com/fwmakc/message-server) | Email queue | 3003 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | Nginx + Docker Compose | 80 |

Add your scaffold-based service to `gateway-server/docker-compose.yml` and
it joins the stack automatically.

### Integrating into existing infrastructure

Already have an API or event system? You can adopt individual services:

- **Need auth?** Run auth-server alongside your existing API. Your frontend
  gets OAuth2 login; your services validate JWT via `/.well-known/jwks.json`.
- **Need events?** Point event-server at your existing services via webhooks.
  No Kafka, no RabbitMQ — just HTTP.
- **Need CRUD?** Install `api-server-toolkit` in your existing NestJS project
  and use `EntityController` for new entities. No need to clone this scaffold.

## Related

- [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) — CRUD engine, guards, columns, bootstrap()
- [gateway-server](https://github.com/fwmakc/gateway-server) — Docker Compose, Nginx, clone-all scripts

---

## Versioning

Each service versions **independently** (semver): a `vX.Y.Z` git tag marks the released state of each repo. There is no stack-wide shared major — compatibility is guaranteed by **exact dependency pins**, not by version numbers.

- Repos on `0.x` (toolkit, api/auth/file/message-server, gateway): the minor carries breaking changes while the stack is in development; patch = fixes.
- `event-server` follows a `1.x` line (stable event-contract surface).
- Consumers pin sources by tag: `"api-server-toolkit": "github:fwmakc/api-server-toolkit#v0.32.0"`, `"event-server": "github:fwmakc/event-server#v1.5.0"`.

### Breaking-change procedure

1. Bump the source repo (toolkit or event-server), tag the release, push.
2. In each consumer: bump the pin in `package.json` (a dedicated `build: pin …` commit), run the tests, push.
3. Update the `Current versions` table below in every repo so it keeps reflecting the actual tags.

### Current versions

> Synced across all repos on 2026-10-07. Source of truth: the `v*` git tags at each repo HEAD.

| Service | Version |
|---------|---------|
| [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) | v0.32.0 |
| [event-server](https://github.com/fwmakc/event-server) | v1.5.0 |
| [auth-server](https://github.com/fwmakc/auth-server) | v0.13.0 |
| [message-server](https://github.com/fwmakc/message-server) | v0.7.0 |
| [file-server](https://github.com/fwmakc/file-server) | v0.8.0 |
| [chat-server](https://github.com/fwmakc/chat-server) | v0.1.3 (frozen) |
| [api-server](https://github.com/fwmakc/api-server) | v0.8.0 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | v0.6.0 (infra) |
| [api-server-scaffold](https://github.com/fwmakc/api-server-scaffold) | v0.1.5 |
