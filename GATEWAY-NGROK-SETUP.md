# Gateway + Full Docker Stack (Frontend + APIs + Ngrok)

## Objetivo

Levantar en una sola red Docker:

- Frontend (`frontend-ecommerce`)
- API ecommerce (`ecommerce`)
- API admin (`admin`)
- Gateway Nginx (single entrypoint)
- Ngrok (opcional por profile)

Con esto, el navegador siempre consume un solo origen y se evitan problemas de CORS/PNA por loopback.

## Archivos involucrados

- `docker-compose.gateway.yml`
- `gateway/nginx.conf`
- `ecommerce/Dockerfile`
- `admin/Dockerfile`
- `.env.gateway.example`

## 1) Preparación

1. Asegura que existan variables en:
   - `ecommerce/.env`
   - `admin/.env`
   - `frontend-ecommerce/.env`

2. Crea `.env` en la raíz para ngrok:

```bash
cp .env.gateway.example .env
```

3. Completa `NGROK_AUTHTOKEN` en el `.env` raíz.

## 2) Levantar stack sin ngrok

```bash
docker compose -f docker-compose.gateway.yml up -d --build
```

Entradas útiles:

- Gateway: `http://localhost:8080`
- Frontend directo: `http://localhost:5173`
- API ecommerce directa: `http://localhost:3000`
- API admin directa: `http://localhost:3001`

## 3) Levantar stack con ngrok

```bash
docker compose --env-file .env --profile ngrok -f docker-compose.gateway.yml up -d --build
```

Ver URL pública en logs:

```bash
docker compose -f docker-compose.gateway.yml logs -f ngrok
```

## 4) Apagar

```bash
docker compose -f docker-compose.gateway.yml down
```

## 4.1) Preflight rapido antes de compartir URL publica

Puedes validar stack + URL publica + endpoints clave con un solo comando:

```powershell
powershell -ExecutionPolicy Bypass -File .\preflight-ngrok.ps1
```

Si quieres que el script intente levantar el stack automaticamente:

```powershell
powershell -ExecutionPolicy Bypass -File .\preflight-ngrok.ps1 -AutoStart
```

## 5) Flujo de rutas

- `/` -> frontend (Vite)
- `/api/v1/checkout/*` -> ecommerce API (checkout-only)
- `/api/v1/admin/*` -> admin API

## 6) Troubleshooting rápido

1. Si aparece `502 Bad Gateway`:
   - Verifica estado: `docker compose -f docker-compose.gateway.yml ps`
   - Verifica logs del gateway: `docker compose -f docker-compose.gateway.yml logs -f gateway`
   - Verifica logs APIs: `docker compose -f docker-compose.gateway.yml logs -f ecommerce-api admin-api`

2. Si falla ngrok:
   - Confirmar `NGROK_AUTHTOKEN` en `.env` raíz.
   - Revisar `docker compose -f docker-compose.gateway.yml logs -f ngrok`.

3. Si falla healthcheck de APIs:
   - Revisar variables requeridas en `ecommerce/.env` y `admin/.env`.

## Nota

El frontend quedó con rutas API relativas (`/api/v1/checkout`, `/api/v1/admin`), por lo que no requiere cambiar base URLs por cada rotación de subdominio ngrok.
