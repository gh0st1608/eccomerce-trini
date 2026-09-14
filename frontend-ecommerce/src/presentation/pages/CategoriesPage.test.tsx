import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@presentation/providers/AppProviders'
import { CategoriesPage } from './CategoriesPage'

vi.mock('@infrastructure/factories/createCategoryRepository', () => ({
  createCategoryRepository: () => ({
    list: async () => [
      {
        id: 'moda',
        name: 'Moda',
        slug: 'moda',
        description: '',
        active: true,
      },
      {
        id: 'vestidos',
        name: 'Vestidos',
        slug: 'vestidos',
        description: '',
        active: true,
        parentId: 'moda',
      },
      {
        id: 'ninos',
        name: 'Gorras deportivas para niños',
        slug: 'gorras-deportivas-para-niños',
        description: '',
        active: false,
        parentId: 'moda',
      },
    ],
  }),
}))

describe('CategoriesPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/categories')
  })

  it('opens a specific category in the filtered storefront catalog', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <Routes>
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/" element={<div>Catalogo</div>} />
        </Routes>
      </AppProviders>,
    )

    await user.click(await screen.findByRole('button', { name: /ver productos de vestidos/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
      expect(window.location.search).toBe('?category=vestidos')
      expect(window.location.hash).toBe('#catalogo-productos')
    })
  })

  it('does not show inactive categories in the public categories view', async () => {
    render(
      <AppProviders>
        <Routes>
          <Route path="/categories" element={<CategoriesPage />} />
        </Routes>
      </AppProviders>,
    )

    await screen.findByRole('button', { name: /ver productos de vestidos/i })

    expect(
      screen.queryByRole('button', { name: /ver productos de gorras deportivas para niños/i }),
    ).not.toBeInTheDocument()
  })
})