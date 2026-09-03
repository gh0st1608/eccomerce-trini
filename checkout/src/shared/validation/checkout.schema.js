import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        color: z.string().min(1).optional(),
        size: z.string().min(1).optional(),
        isGift: z.boolean().optional(),
      }),
    )
    .min(1),
  customer: z.object({
    phone: z.string().trim().min(6).max(30),
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
  }),
  delivery: z.discriminatedUnion('method', [
    z.object({
      method: z.literal('courier'),
    }),
    z.object({
      method: z.literal('pickup'),
      storeId: z.string().min(1),
    }),
  ]),
});
