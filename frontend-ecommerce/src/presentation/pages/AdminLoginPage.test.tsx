import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@presentation/providers/AppProviders'
import { AdminLoginPage } from '@presentation/pages/AdminLoginPage'

function renderAdminLogin() {
  window.history.pushState({}, '', '/admin')
  render(
    <AppProviders>
      <AdminLoginPage />
    </AppProviders>,
  )
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows invalid credentials message when API returns 401', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: {
          message: 'Credenciales invalidas',
        },
      }),
    } as Response)

    renderAdminLogin()

    await user.type(screen.getByPlaceholderText(/usuario/i), 'admin')
    await user.type(screen.getByPlaceholderText(/contrasena/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/credenciales invalidas/i)).toBeInTheDocument()
  })

  it('shows service unavailable message when API returns 502', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({
        success: false,
        error: {
          message: 'Bad gateway',
        },
      }),
    } as Response)

    renderAdminLogin()

    await user.type(screen.getByPlaceholderText(/usuario/i), 'admin')
    await user.type(screen.getByPlaceholderText(/contrasena/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(
      await screen.findByText(/servicio de autenticacion no esta disponible temporalmente/i),
    ).toBeInTheDocument()
  })

  it('shows connectivity message when request fails by network error', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    renderAdminLogin()

    await user.type(screen.getByPlaceholderText(/usuario/i), 'admin')
    await user.type(screen.getByPlaceholderText(/contrasena/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(
      await screen.findByText(/no se pudo conectar con el servicio de autenticacion/i),
    ).toBeInTheDocument()
  })

  it('shows invalid server response message when token is missing on success', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {},
      }),
    } as Response)

    renderAdminLogin()

    await user.type(screen.getByPlaceholderText(/usuario/i), 'admin')
    await user.type(screen.getByPlaceholderText(/contrasena/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(
      await screen.findByText(/respuesta invalida del servidor de autenticacion/i),
    ).toBeInTheDocument()
  })
})
