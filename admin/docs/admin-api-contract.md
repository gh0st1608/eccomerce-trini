# Admin API Contract

This document describes the admin backend contract intended for admin UI integrations.

## Base URL

- Local: `http://localhost:3000/api/v1/admin`

## Response format

### Success

```json
{
  "success": true,
  "data": {},
  "message": "",
  "traceId": "..."
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_ERROR",
    "message": "..."
  },
  "traceId": "..."
}
```

## Categories

### GET /categories

Returns all categories for admin operations.

Example response:

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-001",
        "name": "Camisas",
        "slug": "camisas",
        "description": "Camisas para oficina y casual.",
        "active": true,
        "parentId": "cat-ropa",
        "imageUrl": "https://cdn.example.com/categories/camisas/cover.webp"
      }
    ]
  },
  "message": "Categories listed successfully",
  "traceId": "no-trace"
}
```

### POST /categories

Creates a category.

Request body:

```json
{
  "name": "Polos",
  "slug": "polos",
  "description": "Categoria para polos de temporada",
  "active": true,
  "parentId": "cat-ropa",
  "imageUrl": "https://cdn.example.com/categories/polos/cover.webp"
}
```

Business rules:

- `slug` must match: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `slug` must be unique
- `parentId` is optional. Categories without it are general categories.
- A category referenced by `parentId` must exist and must be a general category.
- `imageUrl` is optional and accepts an HTTP(S) URL or an image Data URL. Data URLs are uploaded to image storage before persistence.

Example success (201):

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "generated-uuid",
      "name": "Polos",
      "slug": "polos",
      "description": "Categoria para polos de temporada",
      "active": true,
      "parentId": "cat-ropa",
      "imageUrl": "https://cdn.example.com/categories/polos/cover.webp"
    }
  },
  "message": "Category created successfully",
  "traceId": "no-trace"
}
```

Example business error (400, invalid slug):

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_ERROR",
    "message": "Invalid category slug format"
  },
  "traceId": "no-trace"
}
```

### PUT /categories/:id

Updates category characteristics.

Request body:

```json
{
  "name": "Polos Premium",
  "slug": "polos-premium",
  "description": "Categoria actualizada",
  "active": true,
  "parentId": "cat-ropa",
  "imageUrl": "https://cdn.example.com/categories/polos-premium/cover.webp"
}
```

Possible errors:

- `404 NOT_FOUND` when category id does not exist.
- `400 BUSINESS_ERROR` for invalid or duplicated slug.
- `400 BUSINESS_ERROR` when the parent does not exist, is already a child, or is the category itself.

## Products (admin scope)

### GET /products

Returns product list for admin operations.

### POST /products

Creates a product with admin fields (`sku`, `status`) plus storefront metadata (`description`, `category`, `imageUrl`, `featured`).

### PUT /products/:id

Updates product characteristics.

Request body:

```json
{
  "name": "Polo Ejecutivo",
  "sku": "PL-EJ-01",
  "description": "Version actualizada",
  "category": "polos",
  "imageUrl": "https://picsum.photos/seed/polo-ej/900/1200",
  "price": 79.9,
  "currency": "PEN",
  "stock": 25,
  "featured": true,
  "status": "active"
}
```

Possible errors:

- `404 NOT_FOUND` when product id does not exist.
- `400 BUSINESS_ERROR` when stock is negative.

## Internal users (admin scope)

### GET /internal-users

Returns internal users.

### POST /internal-users

Creates an internal user with role in `admin|operator|support`.
