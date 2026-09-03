import { z } from 'zod';

export const createInternalUserSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  role: z.enum(['admin', 'operator', 'support']),
  active: z.boolean(),
});
