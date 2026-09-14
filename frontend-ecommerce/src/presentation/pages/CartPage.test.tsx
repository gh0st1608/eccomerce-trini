import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { AppProviders } from '@presentation/providers/AppProviders'
import { AppRouter } from '@presentation/routes/AppRouter'

vi.mock('@infrastructure/factories/createProductRepository', () => ({
  createProductRepository: () => new InMemoryProductRepository(),
}))

vi.mock('@infrastructure/factories/createPickupStoreRepository', () => ({
  createPickupStoreRepository: () => ({ findActive: async () => [] }),
}))

describe('CartPage checkout validation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('lists the missing fields before continuing to WhatsApp', async () => {
    const user = userEvent.setup()

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    )

    const addButtons = await screen.findAllByRole('button', { name: /agregar/i })
    await user.click(addButtons[0])
    await user.click(screen.getAllByRole('button', { name: /carrito \(1\)/i })[0])
    await user.click(
      await screen.findByRole('button', { name: /finalizar compra por whatsapp/i }),
    )

    const dialog = await screen.findByRole('dialog')
    const dialogQueries = within(dialog)

    expect(dialogQueries.getByRole('heading', { name: /completa tus datos/i })).toBeInTheDocument()
    expect(dialogQueries.getByText('Modalidad de entrega')).toBeInTheDocument()
    expect(dialogQueries.getByText(/Celular de contacto/)).toBeInTheDocument()
    expect(dialogQueries.getByText('Nombre')).toBeInTheDocument()
    expect(dialogQueries.getByText('Apellido paterno')).toBeInTheDocument()
    expect(dialogQueries.getByText('Apellido materno')).toBeInTheDocument()
  })
})