import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  address: z.string().min(5),
  district: z.string().min(2),
  reference: z.string().max(500).optional().default(''),
  pickupEnabled: z.boolean().optional().default(true),
  courierEnabled: z.boolean().optional().default(true),
  active: z.boolean().optional().default(true),
});
