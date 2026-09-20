import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CategoryImageManager } from './CategoryImageManager'

function renderManager(
  overrides: Partial<React.ComponentProps<typeof CategoryImageManager>> = {},
) {
  const props: React.ComponentProps<typeof CategoryImageManager> = {
    categoryName: 'Vestidos',
    isRequired: true,
    onChange: vi.fn(),
    onFileSelect: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  render(
    <ChakraProvider value={defaultSystem}>
      <CategoryImageManager {...props} />
    </ChakraProvider>,
  )

  return props
}

describe('CategoryImageManager', () => {
  it('sends a selected image for processing', async () => {
    const user = userEvent.setup()
    const props = renderManager()
    const file = new File(['image'], 'portada.png', { type: 'image/png' })

    await user.upload(screen.getByLabelText('Seleccionar imagen de categoria'), file)

    expect(props.onFileSelect).toHaveBeenCalledWith(file)
  })

  it('previews and removes the current category image', async () => {
    const user = userEvent.setup()
    const props = renderManager({ imageUrl: 'https://cdn.example.com/vestidos.webp' })

    expect(screen.getByRole('img', { name: 'Portada de Vestidos' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/vestidos.webp',
    )

    await user.click(screen.getByRole('button', { name: 'Eliminar imagen' }))

    expect(props.onChange).toHaveBeenCalledWith(undefined)
  })

  it('rejects files larger than 10 MB before processing', async () => {
    const user = userEvent.setup()
    const props = renderManager()
    const oversizedFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'portada-grande.png',
      { type: 'image/png' },
    )

    await user.upload(screen.getByLabelText('Seleccionar imagen de categoria'), oversizedFile)

    expect(await screen.findByText('La imagen no debe superar los 10 MB.')).toBeInTheDocument()
    expect(props.onFileSelect).not.toHaveBeenCalled()
  })
})
