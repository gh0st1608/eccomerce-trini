import { z } from 'zod';

const imageReferenceSchema = z.union([
  z.url(),
  z.string().startsWith('data:image/', 'Expected image URL or base64 image data URL'),
]);

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().max(500).optional().default(''),
  active: z.boolean().optional().default(true),
  parentId: z.string().min(1).optional(),
  imageUrl: imageReferenceSchema.optional(),
});
