import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductImageManager } from './ProductImageManager'

function renderManager(
  overrides: Partial<React.ComponentProps<typeof ProductImageManager>> = {},
) {
  const props: React.ComponentProps<typeof ProductImageManager> = {
    imageUrl: '',
    images: [],
    productName: 'Vestido Aurora',
    onMainImageChange: vi.fn(),
    onGalleryChange: vi.fn(),
    onMainFileSelect: vi.fn().mockResolvedValue(undefined),
    onGalleryFilesSelect: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  render(
    <ChakraProvider value={defaultSystem}>
      <ProductImageManager {...props} />
    </ChakraProvider>,
  )

  return props
}

describe('ProductImageManager', () => {
  it('sends the selected cover and gallery files for processing', async () => {
    const user = userEvent.setup()
    const props = renderManager()
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' })
    const galleryFiles = [
      new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
      new File(['back'], 'back.webp', { type: 'image/webp' }),
    ]

    await user.upload(screen.getByLabelText('Seleccionar portada del producto'), cover)
    await user.upload(screen.getByLabelText('Seleccionar imagenes de galeria'), galleryFiles)

    expect(props.onMainFileSelect).toHaveBeenCalledWith(cover)
    expect(props.onGalleryFilesSelect).toHaveBeenCalledWith(galleryFiles)
  })

  it('previews and removes product images', async () => {
    const user = userEvent.setup()
    const props = renderManager({
      imageUrl: 'https://cdn.example.com/cover.webp',
      images: ['https://cdn.example.com/front.webp'],
    })

    expect(screen.getByRole('img', { name: 'Portada de Vestido Aurora' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Imagen 1 de Vestido Aurora' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Eliminar portada' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(props.onMainImageChange).toHaveBeenCalledWith('')
    expect(props.onGalleryChange).toHaveBeenCalledWith([])
  })

  it('rejects oversized files before processing', async () => {
    const user = userEvent.setup()
    const props = renderManager()
    const oversizedFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'large.png',
      { type: 'image/png' },
    )

    await user.upload(screen.getByLabelText('Seleccionar portada del producto'), oversizedFile)

    expect(await screen.findByText('Cada imagen debe pesar como maximo 10 MB.')).toBeVisible()
    expect(props.onMainFileSelect).not.toHaveBeenCalled()
  })
})