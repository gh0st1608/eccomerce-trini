import { z } from 'zod'

const pickupStoreDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  district: z.string(),
  active: z.boolean(),
  pickupEnabled: z.boolean(),
})

export const pickupStoresResponseSchema = z.union([
  z.object({
    data: z.object({
      stores: z.array(pickupStoreDtoSchema),
    }),
  }),
  z.object({
    success: z.boolean(),
    data: z.object({
      stores: z.array(pickupStoreDtoSchema),
    }),
  }),
])

export type PickupStoresResponseDto = z.infer<typeof pickupStoresResponseSchema>
