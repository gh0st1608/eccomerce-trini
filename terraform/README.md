# Infraestructura como código (Terraform)

Reproduce en AWS (o en LocalStack, en local) la arquitectura que ya corre en
`docker-compose.gateway.yml`:

```
                         ┌────────────────────────┐
 Internet ──────────────▶│  CloudFront (prod) o    │
                         │  S3 website (local)     │──▶ frontend (SPA estatico)
                         └───────────┬─────────────┘
                                     │  /api/v1/*  (mismo contrato que gateway/nginx.conf)
                                     ▼
                         ┌────────────────────────┐
                         │  API Gateway HTTP API   │
                         └───────────┬────────────┘
                     /api/v1/admin/* │        │ /api/v1/checkout/*
                                     ▼        ▼
                         ┌──────────────┐  ┌──────────────┐
                         │ admin Lambda │  │ ecommerce    │
                         │ (S3 + Dynamo)│  │ Lambda       │
                         └─────┬───────┘  └────────────┘
                                │
                    ┌──────────┴──────────┐
                    ▼                          ▼
        S3 (product-images)         DynamoDB (products, categories,
        ──▶ CloudFront (prod only)      stores, internal-users)
```

Cada Lambda usa el mismo `src/lambda.js` (handler `serverless-http`) y las
mismas variables de entorno que ya usan `ecommerce/.env` y `admin/.env`.
`admin` persiste products/categories/stores/internal-users en DynamoDB (real
fuente de verdad tanto en LocalStack como en AWS real; ya no hay dataset
hardcodeado en produccion/staging). Usa `npm run seed:dynamodb` (ver
`admin/scripts/seed-dynamodb.mjs`) para poblar las tablas la primera vez.

## Estructura

| Archivo | Contenido |
|---|---|
| `versions.tf` / `providers.tf` | Version de Terraform y provider AWS (con endpoints redirigibles a LocalStack). |
| `variables.tf` / `locals.tf` | Toda la config parametrizable (mismos nombres que las env vars de `ecommerce`/`admin`). |
| `s3.tf` | Bucket de imagenes de producto y bucket del frontend estatico (privados). |
| `dynamodb.tf` | Tablas de `admin` (products, categories, stores, internal-users), on-demand, fuente de verdad real (local y AWS). |
| `iam.tf` | Roles de ejecucion de cada Lambda + policies de S3 y DynamoDB para `admin`. |
| `lambda.tf` | Las dos funciones Lambda (`ecommerce-api`, `admin-api`) + log groups. |
| `apigateway.tf` | HTTP API con las mismas rutas que `gateway/nginx.conf` (`/api/v1/admin/*`, `/api/v1/checkout/*`). |
| `cdn.tf` | CloudFront para frontend + imagenes (se omite automaticamente si `use_localstack = true`, porque CloudFront requiere LocalStack Pro). |
| `outputs.tf` | URLs e IDs utiles tras el apply. |
| `environments/local.tfvars` | Valores por defecto listos para LocalStack. |
| `scripts/` | Helpers para construir los Lambda zip y levantar LocalStack. |
| `infracost/` | Config y runner Docker de Infracost. |

## Requisito previo: construir los Lambda zip

Terraform referencia `ecommerce/dist/lambda.zip` y `admin/dist/lambda.zip`
(los mismos artefactos que genera el pipeline de CI: Build -> Package Lambda ->
Deploy). Generalos con:

```powershell
.\terraform\scripts\build-lambdas.ps1
# o en bash: ./terraform/scripts/build-lambdas.sh
```

## Probar en local con LocalStack

1. Levantar solo LocalStack (usa el mismo `docker-compose.gateway.yml` del repo):

   ```powershell
   .\terraform\scripts\localstack-up.ps1
   ```

2. Construir los Lambda zip (paso anterior).

3. Aplicar el plan contra LocalStack:

   ```powershell
   .\terraform\scripts\tf-local.ps1 plan
   .\terraform\scripts\tf-local.ps1 apply
   ```

   Esto usa `environments/local.tfvars` (`use_localstack = true`), por lo que
   el provider AWS redirige S3/IAM/Lambda/API Gateway/CloudWatch Logs a
   `http://localhost:4566` con credenciales dummy (`test`/`test`).

4. Destruir todo cuando termines de probar:

   ```powershell
   .\terraform\scripts\tf-local.ps1 destroy
   ```

> CloudFront no se crea en este modo (LocalStack Community no lo soporta). Para
> validar el frontend localmente usa el output `frontend_website_endpoint`
> (sitio estatico S3) y llama a la API directamente con `api_gateway_invoke_url`.

## Desplegar en AWS real

1. Copia `terraform.tfvars.example` a `terraform.tfvars` (ignorado por git) y
   reemplaza los secretos (`jwt_secret`, `admin_auth_token`, `public_api_token`,
   `lnkua_bearer_token`, `new_relic_license_key`, etc.) con valores reales,
   idealmente inyectados desde variables de entorno `TF_VAR_*` en CI, no
   commiteados.
2. Pon `use_localstack = false` y credenciales reales (`aws_access_key_id` /
   `aws_secret_access_key`, o usa el proveedor de credenciales por defecto de
   tu maquina/CI quitando esas dos variables).
3. `terraform init && terraform apply -var-file=terraform.tfvars`.

## Costo proyectado con Infracost (via Docker)

No requiere instalar Infracost localmente, solo Docker y una API key gratuita
de <https://www.infracost.io/>:

```powershell
$env:INFRACOST_API_KEY = "ico-xxxxxxxx"
.\terraform\infracost\run-infracost.ps1
# formato HTML: .\terraform\infracost\run-infracost.ps1 -Format html
```

```bash
export INFRACOST_API_KEY=ico-xxxxxxxx
./terraform/infracost/run-infracost.sh          # tabla en consola
./terraform/infracost/run-infracost.sh html     # reporte HTML
```

El script crea automaticamente un `dist/lambda.zip` de relleno si aun no
corriste el build real (el precio depende de atributos como memoria/runtime,
no del contenido del zip). Los supuestos de trafico (invocaciones Lambda,
requests de API Gateway, storage S3, transferencia CloudFront) estan en
`infracost/infracost-usage.yml` — ajustalos a trafico real cuando lo tengas.
