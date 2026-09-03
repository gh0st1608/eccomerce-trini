import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@presentation/pages/HomePage'
import { CategoriesPage } from '@presentation/pages/CategoriesPage'
import { CartPage } from '@presentation/pages/CartPage'
import { SharedCartPage } from '@presentation/pages/SharedCartPage'
import { ProductDetailPage } from '@presentation/pages/ProductDetailPage'
import { AdminDashboardPage } from '@presentation/pages/AdminDashboardPage'
import { AdminLoginPage } from '@presentation/pages/AdminLoginPage'
import { ProtectedAdminRoute } from '@presentation/routes/ProtectedAdminRoute'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/cart/shared" element={<SharedCartPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
