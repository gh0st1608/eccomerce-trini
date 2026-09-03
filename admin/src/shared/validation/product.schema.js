import { z } from 'zod';

const dataUrlImageRegex = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/;

const imageReferenceSchema = z.string().trim().refine(
  (value) => {
    if (value.startsWith('data:image/')) {
      return dataUrlImageRegex.test(value);
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: 'Expected image URL or base64 image data URL',
  },
);

const productAttributeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  values: z.array(z.string().trim().min(1).max(120)).min(1).max(60),
});

const productPriceSchema = z.object({
  currency: z.string().trim().length(3).toUpperCase(),
  amount: z.number().positive().max(100000),
  originalAmount: z.number().positive().max(100000).optional(),
  discountPercent: z.number().int().min(0).max(90).optional(),
});

const productInventorySchema = z.object({
  quantity: z.number().int().min(0).max(100000),
  inStock: z.boolean().optional(),
});

const storeAvailabilitySchema = z.object({
  storeId: z.string().trim().min(1).max(120),
  available: z.boolean(),
  quantity: z.number().int().min(0).max(100000).optional(),
});

const variantAttributeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(120),
});

const productVariantSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  sku: z.string().trim().min(1).max(60).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  imageUrl: imageReferenceSchema.optional(),
  attributes: z.array(variantAttributeSchema).max(60).optional().default([]),
  inventory: productInventorySchema.optional(),
  prices: z.array(productPriceSchema).max(20).optional().default([]),
});

export const createProductSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(3),
  description: z.string().max(500).optional().default(''),
  category: z.string().min(2),
  variantGroup: z.string().min(2).optional(),
  imageUrl: imageReferenceSchema.optional().default('https://picsum.photos/900/1200'),
  images: z.array(imageReferenceSchema).optional(),
  colors: z.array(z.string().min(1)).optional(),
  sizes: z.array(z.string().min(1)).optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  currency: z.string().length(3),
  stock: z.number().int().min(0),
  featured: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive']),
  productType: z.enum(['simple', 'variable']).optional().default('simple'),
  categories: z.array(z.string().trim().min(2).max(80)).max(20).optional().default([]),
  attributes: z.array(productAttributeSchema).max(60).optional().default([]),
  variants: z.array(productVariantSchema).max(200).optional().default([]),
  inventory: productInventorySchema.optional(),
  prices: z.array(productPriceSchema).max(20).optional().default([]),
  storeAvailability: z.array(storeAvailabilitySchema).max(200).optional().default([]),
});
