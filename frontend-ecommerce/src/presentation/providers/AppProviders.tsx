import type { PropsWithChildren } from 'react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './CartProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <CartProvider>{children}</CartProvider>
      </BrowserRouter>
    </ChakraProvider>
  )
}
