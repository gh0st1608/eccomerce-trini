import { z } from 'zod'

export const adminOrderItemDtoSchema = z.object({
  productId: z.string(),
  productName: z.string().optional().default('Producto'),
  imageUrl: z.string().optional(),
  quantity: z.coerce.number().int(),
  unitPrice: z.coerce.number().default(0),
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional(),
  isGift: z.boolean().optional(),
})

export const adminOrderDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  checkoutUrl: z.string(),
  sharedCartUrl: z.string().url().optional(),
  shortSharedCartUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  paymentStatus: z.enum(['pending', 'paid']).optional().default('pending'),
  customerPhone: z.string().optional().default(''),
  referenceFirstName: z.string().optional().default(''),
  referenceLastName: z.string().optional().default(''),
  itemCount: z.coerce.number().int(),
  subtotal: z.coerce.number(),
  source: z.enum(['api', 'local-checkout-history']).default('api'),
  items: z.array(adminOrderItemDtoSchema).default([]),
})

export type AdminOrderDto = z.infer<typeof adminOrderDtoSchema>

export const adminOrderListResponseSchema = z.union([
  z.array(adminOrderDtoSchema),
  z.object({ data: z.array(adminOrderDtoSchema) }),
  z.object({ data: z.object({ orders: z.array(adminOrderDtoSchema) }) }),
  z.object({ success: z.boolean(), data: z.object({ orders: z.array(adminOrderDtoSchema) }) }),
])

export type AdminOrderListResponse = z.infer<typeof adminOrderListResponseSchema>
