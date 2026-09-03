import { z } from 'zod'

export const checkoutRequestSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      color: z.string().optional(),
      size: z.string().optional(),
      isGift: z.boolean().optional(),
    }),
  ),
  customer: z.object({
    phone: z.string().trim().min(6).max(30),
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
  }),
  delivery: z.discriminatedUnion('method', [
    z.object({ method: z.literal('courier') }),
    z.object({ method: z.literal('pickup'), storeId: z.string().min(1) }),
  ]),
})

export const checkoutResponseSchema = z.union([
  z.object({
    checkoutUrl: z.string().url(),
    sharedCartUrl: z.string().url().nullable().optional(),
    shortSharedCartUrl: z.string().url().nullable().optional(),
  }),
  z.object({
    data: z.object({
      checkoutUrl: z.string().url(),
      sharedCartUrl: z.string().url().nullable().optional(),
      shortSharedCartUrl: z.string().url().nullable().optional(),
    }),
  }),
  z.object({
    success: z.boolean(),
    data: z.object({
      checkoutUrl: z.string().url(),
      sharedCartUrl: z.string().url().nullable().optional(),
      shortSharedCartUrl: z.string().url().nullable().optional(),
    }),
  }),
])

export const sharedCheckoutResponseSchema = z.union([
  z.object({
    sharedCheckout: z.object({
      checkout: z.object({
        itemCount: z.coerce.number().int(),
        subtotal: z.coerce.number(),
        items: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            imageUrl: z.string().optional(),
            category: z.string().optional(),
            quantity: z.coerce.number().int(),
            unitPrice: z.coerce.number(),
            originalPrice: z.coerce.number().optional(),
            discountPercent: z.coerce.number().optional(),
            total: z.coerce.number(),
            color: z.string().optional(),
            size: z.string().optional(),
            isGift: z.boolean().optional(),
          }),
        ),
      }),
      delivery: z.object({
        method: z.enum(['pickup', 'courier']),
        storeId: z.string().optional(),
        storeName: z.string().optional(),
        storeAddress: z.string().optional(),
        storeDistrict: z.string().optional(),
      }),
    }),
  }),
  z.object({
    data: z.object({
      sharedCheckout: z.object({
        checkout: z.object({
          itemCount: z.coerce.number().int(),
          subtotal: z.coerce.number(),
          items: z.array(
            z.object({
              productId: z.string(),
              productName: z.string(),
              imageUrl: z.string().optional(),
              category: z.string().optional(),
              quantity: z.coerce.number().int(),
              unitPrice: z.coerce.number(),
              originalPrice: z.coerce.number().optional(),
              discountPercent: z.coerce.number().optional(),
              total: z.coerce.number(),
              color: z.string().optional(),
              size: z.string().optional(),
              isGift: z.boolean().optional(),
            }),
          ),
        }),
        delivery: z.object({
          method: z.enum(['pickup', 'courier']),
          storeId: z.string().optional(),
          storeName: z.string().optional(),
          storeAddress: z.string().optional(),
          storeDistrict: z.string().optional(),
        }),
      }),
    }),
  }),
])

export type CheckoutRequestDto = z.infer<typeof checkoutRequestSchema>
export type CheckoutResponseDto = z.infer<typeof checkoutResponseSchema>
export type SharedCheckoutResponseDto = z.infer<typeof sharedCheckoutResponseSchema>
