import { z } from 'zod'

const urlOrRelativePathSchema = z.string().refine(
  (value) => {
    if (value.startsWith('/')) {
      return true
    }

    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  { message: 'Expected an absolute URL or a relative path starting with "/".' },
)

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('ecommerce-trini-frontend'),
  VITE_ECOMMERCE_API_BASE_URL: urlOrRelativePathSchema.optional(),
  VITE_ADMIN_API_BASE_URL: urlOrRelativePathSchema.optional(),
  VITE_PUBLIC_API_TOKEN: z.string().optional(),
})

const parsedEnv = envSchema.parse(import.meta.env)

export const env = {
  ...parsedEnv,
  VITE_ECOMMERCE_API_BASE_URL: parsedEnv.VITE_ECOMMERCE_API_BASE_URL ?? '/api/v1/checkout',
  VITE_ADMIN_API_BASE_URL: parsedEnv.VITE_ADMIN_API_BASE_URL ?? '/api/v1/admin',
}
