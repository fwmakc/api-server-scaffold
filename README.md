# Scaffold — Microservice Template

[![Version](https://img.shields.io/badge/version-v0.1.0-blue)](https://github.com/fwmakc/scaffold/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/fwmakc/scaffold/blob/master/LICENSE)

> Reference implementation: 5-minute bootstrap — create a new microservice on the toolkit.
> Clone, rename, add your domain logic, deploy.

## What This Is

A **working scaffold** — not a demo, not a toy. Everything is wired up:
`bootstrap()` startup, `HealthModule`, Sentry, helmet, ValidationPipe, Swagger,
graceful shutdown. You add entities and controllers — the boring infrastructure
is already done.

`main.ts` is 9 lines:

```typescript
import { bootstrap } from "api-server-toolkit/bootstrap";
import { AppModule } from "@src/app.module";

bootstrap({
  module: AppModule,
  serviceName: "my-service",
  cors: true,
});
```

## Pattern

This repo demonstrates the **bootstrap pattern** in the toolkit stack:

- **`main.ts` = 9 lines** — `bootstrap()` handles Sentry, helmet, ValidationPipe, Swagger, cookie-parser, graceful shutdown
- **Everything wired** — HealthModule, CORS, Swagger UI, ReDoc, tsconfig paths
- **No boilerplate** — `nest new` gives you empty project; scaffold gives you production-ready service

Use this when you need: a new microservice that doesn't fit existing patterns.

## Quick Start

```bash
git clone https://github.com/fwmakc/scaffold.git my-service
cd my-service
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
| `src/main.ts` | 9 lines — `bootstrap()` call |
| `src/app.module.ts` | `HealthModule.forRoot()` + your feature modules |
| `package.json` | `api-server-toolkit#v0.12.0`, jest, nest CLI |
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
import { EntityController } from 'api-server-toolkit';

@EntityController({
  name: 'products',
  entity: ProductEntity,
  operations: { create: 'public', read: 'public', update: 'public', delete: 'public' },
})
export class ProductController {}
```

Register in `app.module.ts`, restart — `GET /products` works.

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
import { EntityController } from 'api-server-toolkit';
import { ProductDto } from './products.dto';
import { ProductEntity } from './products.entity';
import { ProductService } from './products.service';

@EntityController({
  name: 'products',
  dto: ProductDto,
  entity: ProductEntity,
  operations: {
    read: 'public',
    create: 'account',
    update: 'owner',
    delete: 'superuser',
  },
})
export class ProductController {
  readonly service: ProductService;
}
```

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
- `GET /products` — public read
- `POST /products/create` — authenticated users
- `PATCH /products/update/:id` — owner only
- `DELETE /products/remove/:id` — superuser only
- `GET /products/swagger` — interactive docs

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

All services in the fwmakc stack share the same **major version**. Same major = guaranteed compatibility.

| Level | Scope | Example |
|-------|-------|---------|
| **Major** | Shared across ALL services. A breaking change in any service bumps the major for everyone. | toolkit 2.x → 3.0.0 ⟹ all services tag v3.0.0 |
| **Minor** | Independent per service. New features (additive). | auth-server 2.1.0 → 2.2.0 |
| **Patch** | Independent per service. Bug fixes. | event-server 2.0.0 → 2.0.1 |

### What triggers a major bump

A breaking change at any intersection point:

- **api-server-toolkit** — guards, columns, decorators, EntityController, bootstrap, services
- **event-server contracts** — DTO field removed/renamed, required field added
- **Inter-service API** — JWT claim format, `X-Internal-Api-Key` scheme, webhook contract
- **Public API** — any endpoint that another service depends on

### What does NOT trigger a major bump

- Bug fixes, performance improvements
- New features (additive — new optional fields, new endpoints)
- Internal refactoring that doesn't change interfaces

### Alignment process

When a service makes a breaking change (e.g., toolkit 2.x → 3.0.0):

1. The changing service bumps its major and tags the release
2. **All other services** get a stack alignment commit:
   - Bump `version` in `package.json`
   - Add CHANGELOG entry: `chore: stack v3 alignment`
   - Update dependency pins if needed
   - Tag `v3.0.0`
3. All services are now on stack v3

### Current versions

| Service | Version |
|---------|---------|
| [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) | v2.1.0 |
| [event-server](https://github.com/fwmakc/event-server) | v2.0.0 |
| [auth-server](https://github.com/fwmakc/auth-server) | v2.0.0 |
| [message-server](https://github.com/fwmakc/message-server) | v2.0.0 |
| [file-server](https://github.com/fwmakc/file-server) | v2.0.0 |
| [chat-server](https://github.com/fwmakc/chat-server) | v2.0.0 |
| [api-server](https://github.com/fwmakc/api-server) | v2.0.0 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | v2.0.0 |
| [scaffold](https://github.com/fwmakc/scaffold) | v2.0.0 |
