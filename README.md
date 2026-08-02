# Scaffold — Microservice Template

> Minimal NestJS service template built on [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit).
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
| `package.json` | `api-server-toolkit#v2.1.0`, jest, nest CLI |
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
