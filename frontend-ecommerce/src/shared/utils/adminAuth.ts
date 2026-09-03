const ADMIN_AUTH_STORAGE_KEY = 'trini-admin-auth-token'

interface AdminAuthRecord {
  token: string
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function saveAdminAuthToken(token: string): void {
  if (!canUseStorage()) {
    return
  }

  const record: AdminAuthRecord = { token }
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(record))
}

export function getAdminAuthToken(): string | null {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AdminAuthRecord
    return typeof parsed.token === 'string' && parsed.token.length > 0 ? parsed.token : null
  } catch {
    return null
  }
}

export function clearAdminAuthToken(): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
}

export function hasAdminSession(): boolean {
  return getAdminAuthToken() !== null
}
