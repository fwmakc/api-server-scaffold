# Contributing to scaffold

Thanks for your interest in contributing! This is the minimal template for new
services in the [fwmakc microservices stack](https://github.com/fwmakc/gateway-server).

## What This Repo Contains

- `main.ts` (9 lines) — uses `bootstrap()` from toolkit
- `app.module.ts` — minimal NestJS module with HealthModule
- `Dockerfile` — multi-stage build (node:22-alpine)
- `tsconfig.json`, `tsconfig.build.json` — TypeScript configs
- `.env.example` — environment variables

## Development Setup

```bash
git clone https://github.com/fwmakc/scaffold.git my-service
cd my-service
cp .env.example .env
npm install
npm run dev
```

Service runs on port **3000** by default (configurable via `PORT` env).

## Using As a Template

1. Clone or fork this repo
2. Rename in `package.json` (`name`, `description`)
3. Add your entities, controllers, and services
4. Register modules in `app.module.ts`
5. Add to `gateway-server/docker-compose.yml`

## Code Style

- TypeScript with strict type checking
- NestJS conventions (modules, controllers, services, DTOs)
- Use `bootstrap()` from `api-server-toolkit/bootstrap`
- Use `HealthModule.forRoot("service-name")` from `api-server-toolkit/health`
- See `AGENTS.md` for detailed conventions

## Pull Request Process

1. Fork the repo, create a branch from `master`
2. Make your changes
3. Ensure TypeScript compiles: `npm run build`
4. Create a pull request with a clear description
