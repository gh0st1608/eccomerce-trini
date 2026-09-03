import { z } from 'zod';

export const adminAuthLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});
