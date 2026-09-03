import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductCard } from './ProductCard'

const product = {
  id: 'prd-1',
  name: 'Camiseta Oversize Blanca',
  description: 'Camiseta de corte holgado en algodon premium.',
  category: 'camisetas',
  imageUrl: 'https://picsum.photos/seed/test/400/400',
  price: 59.9,
  featured: true,
}

function renderCard(compact = false) {
  const onAddToCart = vi.fn()

  render(
    <ChakraProvider value={defaultSystem}>
      <MemoryRouter>
        <ProductCard
          product={product}
          compact={compact}
          onAddToCart={onAddToCart}
          detailTo={`/products/${product.id}`}
        />
      </MemoryRouter>
    </ChakraProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('ProductCard storefront compact UI', () => {
  it('renders standard storefront card with full detail call-to-action', () => {
    renderCard(false)

    expect(screen.getByText(/camiseta de corte holgado en algodon premium\./i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver detalle de/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^ver detalle$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument()
  })

  it('renders compact mobile card with condensed content', () => {
    renderCard(true)

    expect(screen.queryByText(/camiseta de corte holgado en algodon premium\./i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver detalle de/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^ver detalle$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument()
  })
})
