# Admin Trini Backend

Backend enterprise para administración del ecommerce: gestión de productos y usuarios internos.

## Arquitectura

- Hexagonal (Ports and Adapters)
- Casos de uso en `src/application/usecases`
- Dominio en `src/domain`
- Adaptadores en `src/infrastructure`
- Observabilidad en `src/observability`

## Estructura

```txt
src/
  application/
    usecases/
    ports/
  domain/
    entities/
    repositories/
    services/
    exceptions/
  infrastructure/
    controllers/
    routes/
    repositories/
    database/
    clients/
    config/
    middlewares/
  observability/
    telemetry/
    logger/
    metrics/
    tracing/
  shared/
    utils/
    errors/
    constants/
    validation/
  tests/
```

## Instalación

```bash
npm ci
cp .env.example .env
```

## Variables de entorno

Referencia completa en `.env.example`. Todas se centralizan en `src/config/env.js`.

### S3 local (LocalStack)

Para probar carga de imagenes sin una cuenta AWS real:

1. En `.env` de `admin`, habilita:
  - `PRODUCT_IMAGE_STORAGE_ENABLED=true`
2. Levanta el stack con perfil localstack:
  - `docker compose -f docker-compose.gateway.yml --profile localstack up -d --build`
3. Usa los valores de ejemplo para entorno local:
  - `S3_ENDPOINT=http://localstack:4566`
  - `S3_FORCE_PATH_STYLE=true`
  - `S3_BUCKET_NAME=trini-products-local`
  - `S3_BUCKET_PUBLIC_BASE_URL=http://localhost:4566/trini-products-local`
  - `AWS_ACCESS_KEY_ID=test`
  - `AWS_SECRET_ACCESS_KEY=test`

## Scripts

- `npm run dev`
- `npm run start`
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run build`
- `npm run validate`

## Endpoints

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/:id`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`
- `GET /api/v1/admin/internal-users`
- `POST /api/v1/admin/internal-users`
- `GET /health`
- `GET /ready`
- `GET /live`

Nota: todos los endpoints bajo `/api/v1/admin` excepto `/auth/login` requieren header `Authorization: Bearer <token>`.

Contrato de integracion para frontend admin: `docs/admin-api-contract.md`.

## Flujo de petición

Request -> Route -> Validation Middleware -> Controller -> Use Case -> Repository Port -> Adapter -> Response.

## Observabilidad

- OpenTelemetry auto instrumentation
- Exportación OTLP para traces, metrics y logs (compatible New Relic)
- Correlación por `traceId`, `spanId`, `requestId`

## Testing

- Jest + cobertura mínima 90%
- Unit e integration tests

## CI/CD

Workflow en `.github/workflows/ci-cd.yml` con:

1. Checkout
2. Install
3. Lint
4. Prettier check
5. Tests + coverage
6. Build
7. Artifact lambda
8. Deploy Lambda

## Despliegue

`npm run build` genera `dist/lambda.zip` listo para AWS Lambda + API Gateway.
