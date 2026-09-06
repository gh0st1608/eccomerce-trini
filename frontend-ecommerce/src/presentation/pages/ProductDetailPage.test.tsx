import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@presentation/providers/AppProviders'
import { AppRouter } from '@presentation/routes/AppRouter'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'

vi.mock('@infrastructure/factories/createProductRepository', () => ({
  createProductRepository: () => new InMemoryProductRepository(),
}))

vi.setConfig({ testTimeout: 15000 })

describe('ProductDetailPage', () => {
  it('renders detailed product information', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/products/TR-001')

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/chaqueta atlas/i)
      },
      { timeout: 10000 },
    )
    expect(screen.getByRole('button', { name: /elige tus opciones/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^gris$/i }))
    await user.click(screen.getByRole('button', { name: /^s$/i }))
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeEnabled()
    expect(screen.getByText(/sku/i)).toBeInTheDocument()
    const mobileGallery = screen.getByLabelText(/galeria de chaqueta atlas/i)
    const galleryImages = within(mobileGallery).getAllByRole('img')
    expect(galleryImages).toHaveLength(4)
    expect(mobileGallery).toHaveStyle({ overflowX: 'auto', scrollSnapType: 'x mandatory' })
  })
})
