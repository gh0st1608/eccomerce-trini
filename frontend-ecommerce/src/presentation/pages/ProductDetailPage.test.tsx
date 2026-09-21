import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    expect(screen.getByText(/^gris$/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^s$/i }))
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeEnabled()
    expect(screen.getByText(/sku/i)).toBeInTheDocument()
    const mobileGallery = screen.getByLabelText(/galeria de chaqueta atlas/i)
    const galleryImages = within(mobileGallery).getAllByRole('img')
    expect(galleryImages).toHaveLength(4)
    expect(galleryImages[0]).toHaveAttribute('src', expect.stringContaining('photo-1484515991647'))
    expect(galleryImages[1]).toHaveAttribute('src', expect.stringContaining('photo-1539533018447'))
    expect(galleryImages[2]).toHaveAttribute('src', expect.stringContaining('photo-1523398002811'))
    expect(galleryImages[3]).toHaveAttribute('src', expect.stringContaining('photo-1496747611176'))
    expect(mobileGallery).toHaveStyle({ overflowX: 'auto', scrollSnapType: 'x mandatory' })

    Object.defineProperty(mobileGallery, 'clientWidth', { configurable: true, value: 320 })
    Object.defineProperty(mobileGallery, 'scrollLeft', { configurable: true, value: 640 })
    fireEvent.scroll(mobileGallery)

    expect(screen.getByRole('button', { name: /^negro$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/^negro$/i)).toBeInTheDocument()

    Object.defineProperty(mobileGallery, 'scrollLeft', { configurable: true, value: 960 })
    fireEvent.scroll(mobileGallery)

    expect(screen.getByRole('button', { name: /^negro$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/selecciona un color/i)).toBeInTheDocument()
  })
})
