import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogFilters } from '@presentation/components/CatalogFilters'
import { AppProviders } from '@presentation/providers/AppProviders'

describe('CatalogFilters', () => {
  it('shows Peruvian currency and localized actions', () => {
    render(
      <AppProviders>
        <CatalogFilters
          minPrice={45}
          maxPrice={300}
          selectedMaxPrice={120}
          onMaxPriceChange={vi.fn()}
          showFeaturedOnly={false}
          onToggleFeaturedOnly={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText(/S\/\s*45\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Hasta S\/\s*120\.00/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('$')
  })
})