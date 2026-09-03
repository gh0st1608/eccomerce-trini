import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Separator,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createCheckoutGateway } from '@infrastructure/factories/createCheckoutGateway'
import type { SharedCheckoutItem, SharedCheckoutPayload } from '@application/ports/CheckoutGateway'
import { formatCurrency } from '@shared/utils/currency'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'

function CheckoutItemRow({ item }: { item: SharedCheckoutItem }) {
  return (
    <HStack
      align="stretch"
      gap={3}
      p={3}
      border="1px solid"
      borderColor="#e2e8f0"
      borderRadius="xl"
      bg="white"
    >
      <Box
        width={{ base: '72px', md: '84px' }}
        height={{ base: '96px', md: '112px' }}
        borderRadius="lg"
        border="1px solid"
        borderColor="blackAlpha.200"
        bg="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Text fontSize="xs" fontWeight="bold" color="#475569" letterSpacing="0.08em">
            TRINI
          </Text>
        )}
      </Box>

      <VStack align="stretch" gap={1} flex="1" minW={0}>
        <Text fontWeight="semibold" color="#0f172a" lineClamp={2}>
          {item.productName}
        </Text>
        <Badge borderRadius="md" bg="#ffedd5" color="#c2410c" alignSelf="start">
          Ultimo dia
        </Badge>
        <HStack gap={2} wrap="wrap">
          {item.color ? (
            <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
              Color: {item.color}
            </Badge>
          ) : null}
          {item.size ? (
            <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
              Talla: {item.size}
            </Badge>
          ) : null}
          {item.isGift ? (
            <Badge borderRadius="full" bg="#fce7f3" color="#be185d" px={2}>
              Regalo
            </Badge>
          ) : null}
        </HStack>

        <HStack gap={2} align="center" wrap="wrap">
          <Text color="#ea580c" fontWeight="bold" fontSize="xl">
            {formatCurrency(item.unitPrice)}
          </Text>
          {item.originalPrice && item.originalPrice > item.unitPrice ? (
            <Text color="#94a3b8" textDecoration="line-through" fontSize="sm">
              {formatCurrency(item.originalPrice)}
            </Text>
          ) : null}
          {typeof item.discountPercent === 'number' && item.discountPercent > 0 ? (
            <Badge bg="#fff7ed" color="#c2410c" borderRadius="full" px={2}>
              -{item.discountPercent}%
            </Badge>
          ) : null}
        </HStack>

        <HStack justify="space-between" align="center">
          <Text color="#64748b" fontSize="sm">
            Total item: {formatCurrency(item.total)}
          </Text>
          <Box
            px={4}
            py={1}
            borderRadius="md"
            border="1px solid"
            borderColor="#cbd5e1"
            bg="#f8fafc"
            fontSize="sm"
            color="#0f172a"
            fontWeight="semibold"
          >
            {item.quantity} x
          </Box>
        </HStack>
      </VStack>
    </HStack>
  )
}

export function SharedCartPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutGateway = useMemo(() => createCheckoutGateway(), [])

  const token = searchParams.get('token') ?? ''

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sharedCheckout, setSharedCheckout] = useState<SharedCheckoutPayload | null>(null)

  useEffect(() => {
    async function loadSharedCheckout() {
      if (!token) {
        setErrorMessage('El enlace del carrito no tiene token valido.')
        setSharedCheckout(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const result = await checkoutGateway.resolveSharedCheckout(token)
        setSharedCheckout(result)
      } catch {
        setErrorMessage('No se pudo abrir el carrito compartido. Verifica si el enlace sigue siendo valido.')
        setSharedCheckout(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSharedCheckout()
  }, [checkoutGateway, token])

  const items = sharedCheckout?.checkout.items ?? []
  const subtotal = sharedCheckout?.checkout.subtotal ?? 0
  const hasGiftItems = items.some((item) => item.isGift)

  return (
    <Box minH="100dvh" className="app-bg">
      <StoreHeader
        searchTerm=""
        onSearchChange={() => undefined}
        totalProducts={items.length}
        filteredProducts={items.length}
        cartCount={0}
        onCartClick={() => navigate('/cart')}
        showSearch={false}
      />

      <Container maxW="7xl" py={{ base: 5, md: 10 }} pb={{ base: 20, md: 10 }}>
        <VStack align="stretch" gap={{ base: 4, md: 8 }}>
          <Stack gap={2}>
            <Text letterSpacing="0.14em" fontWeight="bold" textTransform="uppercase" color="#ea580c">
              Carrito compartido
            </Text>
            <Heading size={{ base: 'xl', md: '3xl' }} color="#0f172a" fontFamily="'Space Grotesk', sans-serif">
              Detalle del carrito
            </Heading>
            <Text color="#334155" maxW="3xl">
              Vista de productos similar al resumen de compra para revisar rapidamente antes del checkout.
            </Text>
          </Stack>

          {errorMessage ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>No se pudo abrir el carrito</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <Flex direction={{ base: 'column', xl: 'row' }} gap={6} align="start">
            <Box flex="1" width="100%">
              <Box
                bg="rgba(255, 255, 255, 0.94)"
                border="1px solid"
                borderColor="blackAlpha.200"
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="lg"
              >
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between" align="center">
                    <Heading size={{ base: 'sm', md: 'md' }} color="#17222f">
                      Productos seleccionados
                    </Heading>
                    <Text color="#475569">{sharedCheckout?.checkout.itemCount ?? 0} item(s)</Text>
                  </HStack>
                  <Separator />

                  {isLoading ? (
                    <Text color="#64748b">Cargando carrito compartido...</Text>
                  ) : items.length === 0 ? (
                    <Text color="#64748b">No hay items en este carrito compartido.</Text>
                  ) : (
                    <VStack align="stretch" gap={3}>
                      {items.map((item, index) => (
                        <CheckoutItemRow key={`${item.productId}-${index}`} item={item} />
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Box>
            </Box>

            <Box width={{ base: '100%', xl: '360px' }}>
              <Box
                bg="rgba(255, 255, 255, 0.94)"
                border="1px solid"
                borderColor="blackAlpha.200"
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="lg"
                position={{ base: 'static', xl: 'sticky' }}
                top={{ xl: 24 }}
              >
                <VStack align="stretch" gap={4}>
                  <Heading size={{ base: 'sm', md: 'md' }} color="#17222f">
                    Resumen
                  </Heading>
                  <Separator />
                  <HStack justify="space-between">
                    <Text color="#334155">Subtotal</Text>
                    <Text fontWeight="bold" fontSize="xl" color="#ea580c">
                      {formatCurrency(subtotal)}
                    </Text>
                  </HStack>

                  <Box border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={3} bg="#f8fafc">
                    <Text color="#475569" fontSize="sm" mb={1}>
                      Metodo de entrega
                    </Text>
                    <Text color="#0f172a" fontWeight="semibold">
                      {sharedCheckout?.delivery.method === 'pickup' ? 'Retiro en tienda' : 'Entrega por courier'}
                    </Text>
                    {sharedCheckout?.delivery.method === 'pickup' && sharedCheckout.delivery.storeName ? (
                      <Text color="#64748b" fontSize="sm" mt={1}>
                        {sharedCheckout.delivery.storeName}
                        {sharedCheckout.delivery.storeDistrict ? ` - ${sharedCheckout.delivery.storeDistrict}` : ''}
                      </Text>
                    ) : null}
                  </Box>

                  {hasGiftItems ? (
                    <Box border="1px solid" borderColor="#f9a8d4" borderRadius="xl" p={3} bg="#fdf2f8">
                      <Text color="#9d174d" fontWeight="semibold" fontSize="sm">
                        Pedido con regalos
                      </Text>
                      <Text color="#9d174d" fontSize="xs" mt={1}>
                        Los regalos se entregan al centro de recojo; coordina la entrega final por WhatsApp.
                      </Text>
                    </Box>
                  ) : null}

                  <Button bg="#0f172a" color="white" _hover={{ bg: '#1f2937' }} onClick={() => navigate('/')}>
                    Ir al inicio
                  </Button>
                </VStack>
              </Box>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <MobileBottomNav cartCount={0} />
    </Box>
  )
}
