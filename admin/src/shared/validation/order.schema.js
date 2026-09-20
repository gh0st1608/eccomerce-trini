import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  imageUrl: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional(),
  isGift: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  checkoutUrl: z.string().url(),
  sharedCartUrl: z.string().url().optional(),
  shortSharedCartUrl: z.string().url().optional(),
  customerPhone: z.string().min(6).max(20),
  referenceFirstName: z.string().min(1).max(100),
  referenceLastName: z.string().min(1).max(200),
  itemCount: z.number().int().positive(),
  subtotal: z.number().nonnegative(),
  delivery: z.object({
    method: z.enum(['pickup', 'courier']),
    storeId: z.string().optional(),
    storeName: z.string().optional(),
    storeAddress: z.string().optional(),
    storeDistrict: z.string().optional(),
  }),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  paymentStatus: z.enum(['pending', 'paid']).optional(),
}).refine((value) => value.status !== undefined || value.paymentStatus !== undefined, {
  message: 'At least one order field is required',
});