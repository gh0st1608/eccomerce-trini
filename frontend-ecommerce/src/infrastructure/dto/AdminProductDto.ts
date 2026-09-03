import { z } from 'zod'

const productAttributeSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
})

const productPriceSchema = z.object({
  currency: z.string().length(3),
  amount: z.coerce.number(),
  originalAmount: z.coerce.number().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
})

const productInventorySchema = z.object({
  quantity: z.coerce.number().int().min(0),
  inStock: z.boolean().optional(),
})

const variantAttributeSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
})

const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  imageUrl: z.string().url().optional(),
  attributes: z.array(variantAttributeSchema).optional(),
  inventory: productInventorySchema.optional(),
  prices: z.array(productPriceSchema).optional(),
})

const storeAvailabilitySchema = z.object({
  storeId: z.string().min(1),
  available: z.boolean(),
  quantity: z.coerce.number().int().min(0).optional(),
})

export const adminProductDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  variantGroup: z.string().optional(),
  description: z.string().optional().default(''),
  category: z.string().optional().default('General'),
  categories: z.array(z.string().min(1)).optional(),
  imageUrl: z.string().optional().default('https://picsum.photos/900/1200'),
  images: z.array(z.string().url()).optional(),
  colors: z.array(z.string().min(1)).optional(),
  sizes: z.array(z.string().min(1)).optional(),
  productType: z.enum(['simple', 'variable']).optional(),
  attributes: z.array(productAttributeSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
  inventory: productInventorySchema.optional(),
  prices: z.array(productPriceSchema).optional(),
  storeAvailability: z.array(storeAvailabilitySchema).optional(),
  price: z.coerce.number(),
  originalPrice: z.coerce.number().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().optional().default('PEN'),
  stock: z.coerce.number().int(),
  featured: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive']),
})

export type AdminProductDto = z.infer<typeof adminProductDtoSchema>

export const adminProductListResponseSchema = z.union([
  z.array(adminProductDtoSchema),
  z.object({ data: z.array(adminProductDtoSchema) }),
  z.object({ data: z.object({ products: z.array(adminProductDtoSchema) }) }),
  z.object({ success: z.boolean(), data: z.object({ products: z.array(adminProductDtoSchema) }) }),
])

export const adminProductSingleResponseSchema = z.union([
  adminProductDtoSchema,
  z.object({ data: adminProductDtoSchema }),
  z.object({ data: z.object({ product: adminProductDtoSchema }) }),
  z.object({ success: z.boolean(), data: z.object({ product: adminProductDtoSchema }) }),
])

export type AdminProductListResponse = z.infer<typeof adminProductListResponseSchema>
export type AdminProductSingleResponse = z.infer<typeof adminProductSingleResponseSchema>

export const adminProductOptionsResponseSchema = z.union([
  z.object({
    categories: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        active: z.boolean(),
      }),
    ),
    colors: z.array(z.string()),
    sizes: z.array(z.string()),
    productTypes: z.array(z.string()).optional(),
    attributeNames: z.array(z.string()).optional(),
  }),
  z.object({
    data: z.object({
      categories: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          active: z.boolean(),
        }),
      ),
      colors: z.array(z.string()),
      sizes: z.array(z.string()),
      productTypes: z.array(z.string()).optional(),
      attributeNames: z.array(z.string()).optional(),
    }),
  }),
])

export type AdminProductOptionsResponse = z.infer<typeof adminProductOptionsResponseSchema>
