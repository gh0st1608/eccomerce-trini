import { z } from 'zod';

const featuredSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const maxPriceSchema = z.coerce
  .number()
  .positive('maxPrice must be greater than 0')
  .finite('maxPrice must be a valid number');

const statusSchema = z.enum(['active', 'inactive']);

export const catalogQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  maxPrice: maxPriceSchema.optional(),
  featured: featuredSchema.optional(),
  status: statusSchema.optional(),
});
