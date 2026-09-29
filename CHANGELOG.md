# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-09-29
### Changed
- `.env.example`: DB_SYNCHRONIZE hint replaced — the schema is owned by TypeORM migrations only (register them with `migrationsRun: true`, generate via `migration:auto`).

## [0.1.1] - 2026-09-28
### Changed
- Node.js runtime bumped 22 → 24 LTS: Docker images `node:24-alpine`, CI `node-version: 24`.
- Toolkit pinned to `api-server-toolkit#v0.18.0` (adds `ApiKeyGuard` / `@ApiKey()`; no behavior change for existing routes).

## [0.1.0] - 2026-08-03

Version reset to pre-release. The scaffold is a template for new services. Pinned to `api-server-toolkit#v0.9.0`.

## [2.0.0] - 2026-08-03

### Stack v2 alignment
- Major version aligned with api-server-toolkit v2.x
- Pinned to `api-server-toolkit#v2.1.0`
- Minimal NestJS service template: main.ts (9 lines), Dockerfile, configs
- Uses `bootstrap()` + `HealthModule` from toolkit
