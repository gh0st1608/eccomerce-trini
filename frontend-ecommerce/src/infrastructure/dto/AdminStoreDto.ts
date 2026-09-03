import { z } from 'zod'

export const adminStoreDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  district: z.string(),
  reference: z.string().optional().default(''),
  pickupEnabled: z.boolean(),
  courierEnabled: z.boolean(),
  active: z.boolean(),
})

export type AdminStoreDto = z.infer<typeof adminStoreDtoSchema>

export const adminStoreListResponseSchema = z.union([
  z.array(adminStoreDtoSchema),
  z.object({ data: z.array(adminStoreDtoSchema) }),
  z.object({ data: z.object({ stores: z.array(adminStoreDtoSchema) }) }),
  z.object({ success: z.boolean(), data: z.object({ stores: z.array(adminStoreDtoSchema) }) }),
])

export const adminStoreSingleResponseSchema = z.union([
  adminStoreDtoSchema,
  z.object({ data: adminStoreDtoSchema }),
  z.object({ data: z.object({ store: adminStoreDtoSchema }) }),
  z.object({ success: z.boolean(), data: z.object({ store: adminStoreDtoSchema }) }),
])

export type AdminStoreListResponse = z.infer<typeof adminStoreListResponseSchema>
export type AdminStoreSingleResponse = z.infer<typeof adminStoreSingleResponseSchema>
