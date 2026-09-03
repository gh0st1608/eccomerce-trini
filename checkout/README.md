# Ecommerce Trini Backend

Backend enterprise para ecommerce de ropa con checkout por WhatsApp, arquitectura hexagonal y despliegue en AWS Lambda.

## Arquitectura

- Hexagonal (Ports and Adapters)
- Casos de uso en `src/application/usecases`
- Entidades y excepciones de dominio en `src/domain`
- Adaptadores HTTP, repositorios y clientes externos en `src/infrastructure`
- Observabilidad en `src/observability`

## Estructura del proyecto

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

## Instalacion

```bash
npm ci
cp .env.example .env
```

## Variables de entorno

Todas las variables se consumen desde `src/config/env.js`.
No se accede a `process.env` directamente fuera de ese módulo.

Ver referencia completa en `.env.example`.

## Scripts

- `npm run dev`: inicia en modo desarrollo
- `npm run start`: inicia servidor
- `npm run test`: ejecuta pruebas
- `npm run test:watch`: modo watch
- `npm run test:coverage`: pruebas con cobertura
- `npm run lint`: lint estricto
- `npm run lint:fix`: corrige lint
- `npm run format`: formatea código
- `npm run build`: empaqueta lambda zip
- `npm run validate`: lint + prettier + cobertura

## API y flujo de peticion

### Endpoints

Todo el API de este servicio vive bajo el prefijo `/api/v1/checkout` (solo checkout;
el catalogo de productos/categorias y las tiendas administrables viven en `admin`).
ecommerce ya no expone tiendas: valida el `storeId` de retiro consultando
`GET /api/v1/admin/stores/pickup/:id` en `admin` (via `ADMIN_API_BASE_URL` + `PUBLIC_API_TOKEN`).

- `POST /api/v1/checkout/whatsapp`
- `GET /api/v1/checkout/share`
- `GET /api/v1/checkout/shared`
- `GET /health`
- `GET /ready`
- `GET /live`


### Ejemplo checkout

```json
{
  "items": [
    { "productId": "SKU-001", "quantity": 2 },
    { "productId": "SKU-002", "quantity": 1 }
  ]
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://wa.me/...",
    "subtotal": 249.7,
    "itemCount": 2
  },
  "message": "Checkout URL generated",
  "traceId": "..."
}
```

## Observabilidad

- OpenTelemetry con auto instrumentación
- Exportación OTLP para traces, metrics y logs
- Correlación por `traceId`, `spanId`, `requestId`
- Health checks: `/health`, `/ready`, `/live`

## Seguridad

- `helmet`
- `cors`
- `compression`
- rate limit
- timeout de request
- sanitización de entrada

## CI/CD

Pipeline en GitHub Actions:

1. Checkout
2. Install
3. Lint
4. Prettier Check
5. Tests + coverage
6. Build
7. Package Lambda
8. Upload artifact
9. Deploy a AWS Lambda (main/master)

## Testing

- Jest con cobertura mínima global de 90%
- Pruebas unitarias para use cases, services, repositories, middlewares, controllers, utils y validation
- Pruebas de integración API

## Despliegue

`npm run build` genera `dist/lambda.zip` compatible con AWS Lambda + API Gateway.
