import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().max(500).optional().default(''),
  active: z.boolean().optional().default(true),
});
