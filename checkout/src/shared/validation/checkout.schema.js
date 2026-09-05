import { z } from 'zod';

const customerNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/);

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
  customer: z
    .object({
      phone: z
        .string()
        .trim()
        .regex(/^\d{6,9}$/),
      firstName: customerNameSchema,
      lastName: customerNameSchema.optional(),
      paternalLastName: customerNameSchema.optional(),
      maternalLastName: customerNameSchema.optional(),
    })
    .refine(
      (customer) =>
        Boolean(customer.lastName || (customer.paternalLastName && customer.maternalLastName)),
      { message: 'A complete customer last name is required', path: ['paternalLastName'] },
    ),
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
