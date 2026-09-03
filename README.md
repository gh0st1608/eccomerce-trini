# Ecommerce Trini

Monorepo de la plataforma Ecommerce Trini. Contiene el storefront para clientes, las APIs de checkout y administracion, el gateway local y la infraestructura como codigo.

## Estructura

| Carpeta               | Responsabilidad                                           | Puerto local |
| --------------------- | --------------------------------------------------------- | ------------ |
| `frontend-ecommerce/` | Storefront React/Vite y modulo de administracion web      | `5173`       |
| `checkout/`           | API de checkout y generacion de enlaces de WhatsApp       | `3000`       |
| `admin/`              | API de productos, categorias, tiendas y usuarios internos | `3001`       |
| `gateway/`            | Configuracion Nginx para exponer una sola entrada         | `8080`       |
| `terraform/`          | Recursos AWS y LocalStack                                 | `4566`       |
| `postman/`            | Coleccion y ambientes para probar las APIs                | -            |

## Requisitos

- Node.js 20 o superior
- npm
- Docker Desktop y Docker Compose para el stack completo o LocalStack
- Git

## Inicio rapido con Docker

1. Copia los archivos de entorno de ejemplo:

   ```powershell
   Copy-Item admin/.env.example admin/.env
   Copy-Item checkout/.env.example checkout/.env
   Copy-Item frontend-ecommerce/.env.example frontend-ecommerce/.env
   ```

2. Levanta frontend y APIs sin tunel publico:

   ```powershell
   docker compose -f docker-compose.gateway.yml --profile backend --profile frontend up -d --build
   ```

3. Abre el storefront en `http://localhost:5173`. Las APIs quedan disponibles en `http://localhost:3000` y `http://localhost:3001`.

4. Revisa el estado o detiene los servicios:

   ```powershell
   docker compose -f docker-compose.gateway.yml ps
   docker compose -f docker-compose.gateway.yml down
   ```

El perfil `gateway` incluye las APIs, el frontend, Nginx y ngrok. Requiere `NGROK_AUTHTOKEN` en un `.env` de la raiz:

```powershell
Copy-Item .env.gateway.example .env
# Edita .env y completa NGROK_AUTHTOKEN
docker compose --env-file .env --profile gateway up -d --build
```

Para validaciones de la URL publica usa:

```powershell
powershell -ExecutionPolicy Bypass -File .\preflight-ngrok.ps1
```

## Ejecucion sin Docker

Instala dependencias y configura el entorno en cada proyecto:

```powershell
Push-Location admin; npm ci; Copy-Item .env.example .env; Pop-Location
Push-Location checkout; npm ci; Copy-Item .env.example .env; Pop-Location
Push-Location frontend-ecommerce; npm ci; Copy-Item .env.example .env; Pop-Location
```

En tres terminales separadas ejecuta:

```powershell
cd admin; npm run dev
cd checkout; npm run dev
cd frontend-ecommerce; npm run dev
```

Los detalles de variables, endpoints y scripts propios estan en los README de `admin`, `checkout` y `frontend-ecommerce`.

## Validacion

Desde cada proyecto se pueden ejecutar los comandos correspondientes:

```powershell
npm run lint
npm run format:check
npm test
npm run build
```

El comando `npm run validate` combina lint, formato y cobertura donde esta definido. La cobertura y los reportes se generan localmente y estan excluidos por `.gitignore`.

## Infraestructura local

Para usar LocalStack y Terraform:

```powershell
.\terraform\scripts\localstack-up.ps1
.\terraform\scripts\build-lambdas.ps1
.\terraform\scripts\tf-local.ps1 plan
.\terraform\scripts\tf-local.ps1 apply
```

Los estados, planes, variables reales y artefactos Lambda no deben subirse al repositorio. Usa `terraform.tfvars.example` como referencia para AWS y carga secretos mediante variables de entorno o el sistema de secretos de CI/CD.

## Convenciones de versionado

- No subir archivos `.env` reales, tokens, claves, dependencias, coberturas, logs ni builds.
- Si una variable es necesaria para configurar un servicio, documentarla en el `.env.example` correspondiente.
- Mantener los `package-lock.json` versionados para instalaciones reproducibles.

## Crear el repositorio remoto

Si la carpeta aun no tiene un repositorio Git inicializado:

```powershell
git init
git add .
git status
git commit -m "chore: initial monorepo"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Reemplaza la URL del remoto antes de ejecutar `git push`. Comprueba siempre `git status` para verificar que no se incluyan secretos ni artefactos generados.
