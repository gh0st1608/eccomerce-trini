import { z } from 'zod'

export const storefrontSettingsSchema = z.object({
  catalogOptions: z.object({
    colors: z.array(z.string()),
    sizes: z.array(z.string()),
  }),
  promoBanner: z.object({
    enabled: z.boolean(),
    eyebrow: z.string(),
    title: z.string(),
    content: z.string(),
    imageUrl: z.string(),
    ctaLabel: z.string(),
  }),
})

export const storefrontSettingsResponseSchema = z.union([
  storefrontSettingsSchema,
  z.object({ data: z.object({ settings: storefrontSettingsSchema }) }),
  z.object({ success: z.boolean(), data: z.object({ settings: storefrontSettingsSchema }) }),
])

export type StorefrontSettingsResponse = z.infer<typeof storefrontSettingsResponseSchema>