import { z } from 'zod';

const uniqueOptions = z.array(z.string().trim().min(1).max(60)).max(100).transform((values) =>
  [...new Set(values)],
);

export const storefrontSettingsSchema = z.object({
  catalogOptions: z.object({
    colors: uniqueOptions,
    sizes: uniqueOptions,
  }),
  promoBanner: z.object({
    enabled: z.boolean(),
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().max(300),
    imageUrl: z.union([z.url(), z.literal('')]),
    ctaLabel: z.string().trim().min(1).max(40),
  }),
});