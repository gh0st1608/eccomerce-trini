# Ecommerce Trini Frontend

Frontend separado del backend, construido con React + Chakra UI y arquitectura hexagonal.

## Arquitectura

- Hexagonal (Ports and Adapters)
- Casos de uso en `src/application/use-cases`
- Entidades de dominio en `src/domain`
- Adaptadores e infraestructura en `src/infrastructure`
- Presentacion y UI en `src/presentation`
- Utilidades compartidas en `src/shared`

## Estructura del proyecto

```txt
src/
  application/
    ports/
    use-cases/
  domain/
    entities/
  infrastructure/
    gateways/
    config/
    dto/
    mappers/
    clients/
    factories/
    repositories/
  presentation/
    components/
    pages/
    providers/
    routes/
  shared/
    utils/
  tests/
```

## Instalacion

```bash
npm ci
cp .env.example .env
```

## Exponer con ngrok

La forma mas limpia es levantar el frontend y el túnel con Docker Compose:

```bash
docker compose up --build
```

Para que ngrok funcione, agrega tu token en `.env` con `NGROK_AUTHTOKEN`.

El frontend queda disponible en `http://localhost:5173` y ngrok imprime la URL publica en sus logs. Si quieres verla en tiempo real, usa:

```bash
npm run docker:logs
```

Si prefieres correr sin Docker, `npm run dev` ya escucha en `0.0.0.0:5173`, por lo que tambien puedes tunelizarlo con una instalacion local de ngrok.

## Variables de entorno

- `VITE_APP_NAME`: nombre de la aplicacion
- `VITE_ECOMMERCE_API_BASE_URL`: base URL del backend ecommerce (ej: `http://localhost:3000/api/v1/checkout`)
- `VITE_ADMIN_API_BASE_URL`: base URL del backend admin (ej: `http://localhost:3001/api/v1/admin`)
- `NGROK_AUTHTOKEN`: token de autenticacion para el túnel

## Scripts

- `npm run dev`: inicia en modo desarrollo
- `npm run build`: compila TypeScript y genera build de produccion
- `npm run start`: sirve el build localmente
- `npm run test`: ejecuta pruebas
- `npm run test:watch`: pruebas en modo watch
- `npm run test:coverage`: pruebas con cobertura
- `npm run lint`: lint estricto
- `npm run lint:fix`: corrige lint
- `npm run format`: formatea codigo
- `npm run format:check`: valida formato
- `npm run validate`: lint + prettier + cobertura

## Stack

- React 19 + Vite
- Chakra UI
- React Router
- Vitest + Testing Library
- ESLint + Prettier

## Estado actual

- Catalogo destacado consume `GET /products` con cliente HTTP y mapeo DTO a dominio.
- Si la API no esta disponible, se usa fallback local in-memory para mantener UX en desarrollo.
- Checkout WhatsApp tiene base hexagonal (`CheckoutGateway` + `GenerateCheckoutUrlUseCase` + `HttpCheckoutGateway`) lista para integrar con UI de carrito.
- Modulo admin en ruta `/admin` para gestionar productos, categorias y listar ordenes.
