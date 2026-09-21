import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductColorImageManager } from './ProductColorImageManager'

describe('ProductColorImageManager', () => {
  it('starts color-specific configuration when files are selected', async () => {
    const user = userEvent.setup()
    const onFilesSelect = vi.fn().mockResolvedValue(undefined)

    render(
      <ChakraProvider value={defaultSystem}>
        <ProductColorImageManager
          colors={['Animal print']}
          colorOptions={[]}
          onChange={vi.fn()}
          onFilesSelect={onFilesSelect}
        />
      </ChakraProvider>,
    )

    const files = [new File(['front'], 'front.jpg', { type: 'image/jpeg' })]
    await user.upload(screen.getByLabelText('Seleccionar imagenes para Animal print'), files)

    expect(onFilesSelect).toHaveBeenCalledWith('Animal print', files)
    expect(screen.getByText('Carga al menos una imagen para este color.')).toBeVisible()
  })
})