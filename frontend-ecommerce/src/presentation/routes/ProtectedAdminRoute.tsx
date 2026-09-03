import { Navigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { hasAdminSession } from '@shared/utils/adminAuth'

export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  if (!hasAdminSession()) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
