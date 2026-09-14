import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CategoryCarousel } from './CategoryCarousel'

describe('CategoryCarousel', () => {
  it('shows a readable category name while preserving its filter value', async () => {
    const user = userEvent.setup()
    const onSelectCategory = vi.fn()

    render(
      <ChakraProvider value={defaultSystem}>
        <CategoryCarousel
          categories={[{ name: 'Conjunto deportivo mujer', value: 'conjuntodeportivomujer', count: 7 }]}
          onSelectCategory={onSelectCategory}
        />
      </ChakraProvider>,
    )

    await user.click(screen.getByRole('button', { name: /conjunto deportivo mujer/i }))

    expect(screen.getByText('Conjunto deportivo mujer')).toBeInTheDocument()
    expect(onSelectCategory).toHaveBeenCalledWith('conjuntodeportivomujer')
  })
})