import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@presentation/providers/AppProviders'
import { AppRouter } from '@presentation/routes/AppRouter'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'

vi.mock('@infrastructure/factories/createProductRepository', () => ({
  createProductRepository: () => new InMemoryProductRepository(),
}))

vi.mock('@infrastructure/factories/createCategoryRepository', () => ({
  createCategoryRepository: () => ({
    list: async () => [
      { id: '1', name: 'Electronica', slug: 'electronica', description: '', active: true },
      {
        id: '2',
        name: 'Set',
        slug: 'set',
        description: '',
        active: true,
        parentId: '7',
      },
      { id: '3', name: 'Bottoms', slug: 'bottoms', description: '', active: true, parentId: '8' },
      { id: '4', name: 'Dress', slug: 'dress', description: '', active: true, parentId: '8' },
      { id: '5', name: 'Accessories', slug: 'accessories', description: '', active: false },
      { id: '6', name: 'Shirts', slug: 'shirts', description: '', active: true },
      { id: '7', name: 'Moda', slug: 'moda', description: '', active: false },
      { id: '8', name: 'Coleccion', slug: 'coleccion', description: '', active: true },
    ],
  }),
}))

vi.setConfig({ testTimeout: 15000 })

describe('HomePage', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    window.history.pushState({}, '', '/')
    scrollIntoView.mockClear()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  it('filters from the category carousel and moves the view to the catalog', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    await user.click(await screen.findByRole('button', { name: /ver productos de electronica/i }))

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(screen.getByText('1 producto(s) disponibles')).toBeInTheDocument()
  })

  it('hides inactive categories and children of hidden categories from the carousel', async () => {
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    await screen.findByRole('button', { name: /ver productos de electronica/i })

    expect(screen.queryByRole('button', { name: /ver productos de set/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /ver productos de accessories/i }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText(/set eclipse/i).length).toBeGreaterThan(0)
  })

  it('filters a general category including products from all its specific categories', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    await user.click(await screen.findByRole('button', { name: /ver productos de coleccion/i }))

    expect(screen.getByText('2 producto(s) disponibles')).toBeInTheDocument()
    expect(screen.getAllByText(/pantalon skyline/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/vestido nimbus/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /ver productos de bottoms/i })).not.toBeInTheDocument()
  })

  it('moves the view to the filtered catalog when opened from a category link', async () => {
    window.history.pushState({}, '', '/?category=Set#catalogo-productos')

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(screen.getByText('1 producto(s) disponibles')).toBeInTheDocument()
    })
  })

  it('renders storefront UI, supports search, and navigates to product detail', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    expect(
      screen.getByRole('heading', {
        name: /hasta 30% off en prendas seleccionadas/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/oferta de temporada/i)).toBeInTheDocument()

    expect((await screen.findAllByText(/chaqueta atlas/i)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/pantalon skyline/i)).length).toBeGreaterThan(0)

    const searchInput = screen.getByPlaceholderText(/buscar por producto, categoria o descripcion/i)
    await user.type(searchInput, 'orbit')

    expect((await screen.findAllByText(/camisa orbit/i)).length).toBeGreaterThan(0)

    const addButtons = await screen.findAllByRole('button', { name: /agregar/i })
    await user.click(addButtons[0])

    expect(screen.getAllByRole('button', { name: /carrito \(1\)/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent(/camisa orbit se agrego al carrito/i)
    expect(screen.queryByRole('heading', { name: /^carrito$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /finalizar por whatsapp/i })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /carrito \(1\)/i })[0])
    expect(await screen.findByRole('heading', { name: /resumen de pedido/i })).toBeInTheDocument()
    expect(screen.getAllByText(/camisa orbit/i).length).toBeGreaterThan(0)

    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))

    const detailLinks = await screen.findAllByRole('link', { name: /ver detalle/i })
    await user.click(detailLinks[0])

    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/camisa orbit/i)
      },
      { timeout: 10000 },
    )
  })

  it('allows opening product detail from catalog buttons repeatedly (mobile-safe regression)', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    const detailLinks = await screen.findAllByRole('link', { name: /ver detalle/i })
    expect(detailLinks.length).toBeGreaterThan(1)

    await user.click(detailLinks[0])

    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/chaqueta atlas/i)
      },
      { timeout: 10000 },
    )

    const homeButtons = await screen.findAllByRole('button', { name: /^home$/i })
    await user.click(homeButtons[0])

    await waitFor(
      () => {
        expect(screen.getAllByRole('link', { name: /ver detalle/i }).length).toBeGreaterThan(1)
      },
      { timeout: 10000 },
    )

    const setEclipseDetailLink = await screen.findByRole('link', {
      name: /ver detalle de set eclipse/i,
    })
    await user.click(setEclipseDetailLink)

    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/set eclipse/i)
      },
      { timeout: 10000 },
    )
  })
})
