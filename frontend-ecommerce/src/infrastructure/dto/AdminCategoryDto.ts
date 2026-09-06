import { z } from 'zod'

export const adminCategoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().default(''),
  active: z.boolean(),
  parentId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export type AdminCategoryDto = z.infer<typeof adminCategoryDtoSchema>

export const adminCategoryListResponseSchema = z.union([
  z.array(adminCategoryDtoSchema),
  z.object({ data: z.array(adminCategoryDtoSchema) }),
  z.object({ data: z.object({ categories: z.array(adminCategoryDtoSchema) }) }),
  z.object({
    success: z.boolean(),
    data: z.object({ categories: z.array(adminCategoryDtoSchema) }),
  }),
])

export const adminCategorySingleResponseSchema = z.union([
  adminCategoryDtoSchema,
  z.object({ data: adminCategoryDtoSchema }),
  z.object({ data: z.object({ category: adminCategoryDtoSchema }) }),
  z.object({ success: z.boolean(), data: z.object({ category: adminCategoryDtoSchema }) }),
])

export type AdminCategoryListResponse = z.infer<typeof adminCategoryListResponseSchema>
export type AdminCategorySingleResponse = z.infer<typeof adminCategorySingleResponseSchema>
