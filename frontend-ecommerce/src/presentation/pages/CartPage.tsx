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
  Input,
  Separator,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { GenerateCheckoutUrlUseCase } from '@application/use-cases/GenerateCheckoutUrlUseCase'
import { GetFeaturedProductsUseCase } from '@application/use-cases/GetFeaturedProductsUseCase'
import type { CheckoutItem } from '@domain/entities/CheckoutItem'
import type { CheckoutCustomer } from '@domain/entities/CheckoutCustomer'
import type { Product } from '@domain/entities/Product'
import { createCheckoutGateway } from '@infrastructure/factories/createCheckoutGateway'
import { ListPickupStoresUseCase } from '@application/use-cases/ListPickupStoresUseCase'
import { createPickupStoreRepository } from '@infrastructure/factories/createPickupStoreRepository'
import { createProductRepository } from '@infrastructure/factories/createProductRepository'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { formatCurrency } from '@shared/utils/currency'
import { CategoryCarousel, type CarouselCategory } from '@presentation/components/CategoryCarousel'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@presentation/providers/cart-context'
import { registerCheckoutOrder } from '@shared/utils/adminOrderHistory'
import type { PickupStore } from '@domain/entities/PickupStore'
import { HomeIcon, MinusIcon, PlusIcon } from '@presentation/components/UiIcons'

export function CartPage() {
  const navigate = useNavigate()
  const {
    cartItemsList,
    cartItemCount,
    cartSubtotal,
    increaseQuantity,
    removeFromCart,
    moveOneItemToGift,
    moveOneItemToStandard,
    clearCart,
  } = useCart()
  const generateCheckoutUrlUseCase = useMemo(() => {
    const checkoutGateway = createCheckoutGateway()
    return new GenerateCheckoutUrlUseCase(checkoutGateway)
  }, [])
  const listPickupStoresUseCase = useMemo(() => {
    const pickupStoreRepository = createPickupStoreRepository()
    return new ListPickupStoresUseCase(pickupStoreRepository)
  }, [])
  const getFeaturedProductsUseCase = useMemo(() => {
    const productRepository = createProductRepository()
    return new GetFeaturedProductsUseCase(productRepository)
  }, [])
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | null>(null)
  const [pickupStores, setPickupStores] = useState<PickupStore[]>([])
  const [selectedPickupStoreId, setSelectedPickupStoreId] = useState('')
  const [isLoadingPickupStores, setIsLoadingPickupStores] = useState(false)
  const [pickupStoresErrorMessage, setPickupStoresErrorMessage] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [referenceFirstName, setReferenceFirstName] = useState('')
  const [referenceLastName, setReferenceLastName] = useState('')
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])

  const categories = useMemo<CarouselCategory[]>(() => {
    const summaries = new Map<string, CarouselCategory>()

    categoryProducts.forEach((product) => {
      const current = summaries.get(product.category)

      if (!current) {
        summaries.set(product.category, {
          name: product.category,
          count: 1,
          imageUrl: product.imageUrl,
        })
        return
      }

      summaries.set(product.category, {
        ...current,
        count: current.count + 1,
      })
    })

    return Array.from(summaries.values())
  }, [categoryProducts])

  useEffect(() => {
    async function loadPickupStores() {
      try {
        setIsLoadingPickupStores(true)
        setPickupStoresErrorMessage('')
        const stores = await listPickupStoresUseCase.execute()
        setPickupStores(stores)
      } catch {
        setPickupStores([])
        setPickupStoresErrorMessage('No se pudo cargar la lista de tiendas para retiro.')
      } finally {
        setIsLoadingPickupStores(false)
      }
    }

    void loadPickupStores()
  }, [listPickupStoresUseCase])

  useEffect(() => {
    async function loadCategoryProducts() {
      try {
        setCategoryProducts(await getFeaturedProductsUseCase.execute())
      } catch {
        const fallbackRepository = new InMemoryProductRepository()
        setCategoryProducts(await fallbackRepository.findFeatured())
      }
    }

    void loadCategoryProducts()
  }, [getFeaturedProductsUseCase])

  const selectedPickupStore = useMemo(
    () => pickupStores.find((store) => store.id === selectedPickupStoreId) ?? null,
    [pickupStores, selectedPickupStoreId],
  )

  const hasGiftItems = cartItemsList.some((item) => item.isGift)

  const isDeliverySelectionValid =
    (!hasGiftItems && deliveryMethod === 'courier') ||
    (deliveryMethod === 'pickup' && selectedPickupStoreId.length > 0)

  const isCustomerInfoValid =
    customerPhone.trim().length >= 6 &&
    referenceFirstName.trim().length >= 2 &&
    referenceLastName.trim().length >= 2

  const isCheckoutDisabled =
    cartItemsList.length === 0 ||
    isCheckoutLoading ||
    !isDeliverySelectionValid ||
    !isCustomerInfoValid

  useEffect(() => {
    if (hasGiftItems) {
      setDeliveryMethod('pickup')
    }
  }, [hasGiftItems])

  async function handleCheckout() {
    if (!isDeliverySelectionValid) {
      setCheckoutErrorMessage('Selecciona una modalidad de entrega para continuar con WhatsApp.')
      return
    }

    try {
      setIsCheckoutLoading(true)
      setCheckoutErrorMessage('')

      const checkoutItems: CheckoutItem[] = cartItemsList.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        color: item.selectedColor,
        size: item.selectedSize,
        isGift: item.isGift,
      }))

      const checkoutCustomer: CheckoutCustomer = {
        phone: customerPhone.trim(),
        firstName: referenceFirstName.trim(),
        lastName: referenceLastName.trim(),
      }

      const checkoutLinks = await generateCheckoutUrlUseCase.execute(
        checkoutItems,
        deliveryMethod === 'pickup' ? { method: 'pickup', storeId: selectedPickupStoreId } : { method: 'courier' },
        checkoutCustomer,
      )
      registerCheckoutOrder({
        items: cartItemsList,
        subtotal: cartSubtotal,
        checkoutUrl: checkoutLinks.checkoutUrl,
        sharedCartUrl: checkoutLinks.sharedCartUrl ?? undefined,
        shortSharedCartUrl: checkoutLinks.shortSharedCartUrl ?? undefined,
        customerPhone: checkoutCustomer.phone,
        referenceFirstName: checkoutCustomer.firstName,
        referenceLastName: checkoutCustomer.lastName,
      })
      window.open(checkoutLinks.checkoutUrl, '_blank', 'noopener,noreferrer')
      clearCart()
      navigate('/')
    } catch {
      setCheckoutErrorMessage('No fue posible generar el checkout por WhatsApp.')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  return (
    <Box minH="100dvh" className="app-bg">
      <StoreHeader
        searchTerm=""
        onSearchChange={() => undefined}
        totalProducts={cartItemsList.length}
        filteredProducts={cartItemsList.length}
        cartCount={cartItemCount}
        onCartClick={() => navigate('/cart')}
        showSearch={false}
      />

      <Container maxW="7xl" py={{ base: 5, md: 10 }} pb={{ base: 20, md: 10 }}>
        <VStack align="stretch" gap={{ base: 4, md: 8 }}>
          <Box
            bg="rgba(255, 255, 255, 0.78)"
            border="1px solid"
            borderColor="#e4d3ee"
            borderRadius="2xl"
            p={{ base: 3, md: 5 }}
            boxShadow="0 12px 30px rgba(72, 33, 96, 0.1)"
          >
            <Stack gap={4}>
              <HStack justify="space-between" gap={3} flexWrap="wrap">
                <Text color="#5c3275" fontWeight="extrabold" letterSpacing="0.06em" textTransform="uppercase" fontSize="sm">
                  Sigue explorando
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="#7b4e98"
                  color="#5c3275"
                  _hover={{ bg: '#f4e8ff' }}
                  onClick={() => navigate('/')}
                >
                  <HomeIcon size={16} />
                  Seguir comprando
                </Button>
              </HStack>
              <CategoryCarousel
                categories={categories}
                onSelectCategory={(categoryName) => navigate(`/?category=${encodeURIComponent(categoryName)}`)}
              />
            </Stack>
          </Box>

          {checkoutErrorMessage ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Checkout no disponible</Alert.Title>
                <Alert.Description>{checkoutErrorMessage}</Alert.Description>
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
                      Resumen de pedido
                    </Heading>
                    <Text color="#475569">{cartItemCount} item(s)</Text>
                  </HStack>
                  <Separator />

                  {cartItemsList.length === 0 ? (
                    <Text color="#64748b">Aun no agregaste productos al carrito.</Text>
                  ) : (
                    <Stack gap={3}>
                      {cartItemsList.map((item) => (
                        <HStack
                          key={item.lineId}
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
                            flexShrink={0}
                          >
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
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
                            <HStack justify="space-between" align="start">
                              <VStack align="start" gap={1} flex="1">
                                <Text fontWeight="semibold" color="#0f172a" lineClamp={2}>
                                  {item.product.name}
                                </Text>
                                <Badge borderRadius="md" bg="#ffedd5" color="#c2410c" alignSelf="start">
                                  Ultimo dia
                                </Badge>
                                <HStack gap={2} wrap="wrap">
                                  {item.selectedColor ? (
                                    <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
                                      Color: {item.selectedColor}
                                    </Badge>
                                  ) : null}
                                  {item.selectedSize ? (
                                    <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
                                      Talla: {item.selectedSize}
                                    </Badge>
                                  ) : null}
                                  {item.isGift ? (
                                    <Badge borderRadius="full" bg="#fce7f3" color="#be185d" px={2}>
                                      Regalo
                                    </Badge>
                                  ) : null}
                                </HStack>
                              </VStack>
                              <Button
                                size="xs"
                                variant="ghost"
                                color="#c2410c"
                                onClick={() => removeFromCart(item.lineId)}
                              >
                                Quitar
                              </Button>
                            </HStack>

                            <HStack gap={2} align="center" wrap="wrap">
                              <Text color="#ea580c" fontWeight="bold" fontSize="xl">
                                {formatCurrency(item.product.price)}
                              </Text>
                              {item.product.originalPrice && item.product.originalPrice > item.product.price ? (
                                <Text color="#94a3b8" textDecoration="line-through" fontSize="sm">
                                  {formatCurrency(item.product.originalPrice)}
                                </Text>
                              ) : null}
                              {typeof item.product.discountPercent === 'number' && item.product.discountPercent > 0 ? (
                                <Badge bg="#fff7ed" color="#c2410c" borderRadius="full" px={2}>
                                  -{item.product.discountPercent}%
                                </Badge>
                              ) : null}
                            </HStack>

                            <HStack justify="space-between" align="center" gap={2} flexWrap="wrap">
                              <Text color="#64748b" fontSize="sm">
                                Total item: {formatCurrency(item.product.price * item.quantity)}
                              </Text>
                              <HStack gap={1}>
                                <Button
                                  aria-label={`Disminuir ${item.product.name}`}
                                  size="xs"
                                  variant="outline"
                                  borderColor="#d8c4e3"
                                  onClick={() => removeFromCart(item.lineId)}
                                >
                                  <MinusIcon size={14} />
                                </Button>
                                <Box
                                  minW="34px"
                                  py={1}
                                  borderRadius="md"
                                  bg="#f4e8ff"
                                  fontSize="sm"
                                  color="#4a1d63"
                                  fontWeight="bold"
                                  textAlign="center"
                                >
                                  {item.quantity}
                                </Box>
                                <Button
                                  aria-label={`Aumentar ${item.product.name}`}
                                  size="xs"
                                  variant="outline"
                                  borderColor="#d8c4e3"
                                  disabled={typeof item.product.stock === 'number' && item.quantity >= item.product.stock}
                                  onClick={() => increaseQuantity(item.lineId)}
                                >
                                  <PlusIcon size={14} />
                                </Button>
                              </HStack>
                            </HStack>

                            <Box borderTop="1px solid" borderColor="#f1f5f9" pt={2}>
                              <HStack justify="space-between" gap={2} flexWrap="wrap">
                                <Text color={item.isGift ? '#be185d' : '#64748b'} fontSize="xs" fontWeight="medium">
                                  {item.isGift
                                    ? 'Esta línea se identifica como regalo.'
                                    : 'Marca unidades individuales como regalo.'}
                                </Text>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  borderColor={item.isGift ? '#f9a8d4' : '#c4b5fd'}
                                  color={item.isGift ? '#be185d' : '#5b21b6'}
                                  _hover={{ bg: item.isGift ? '#fdf2f8' : '#f5f3ff' }}
                                  onClick={() => {
                                    if (item.isGift) {
                                      moveOneItemToStandard(item.lineId)
                                      return
                                    }

                                    moveOneItemToGift(item.lineId)
                                  }}
                                >
                                  {item.isGift ? 'Quitar 1 regalo' : 'Marcar 1 como regalo'}
                                </Button>
                              </HStack>
                            </Box>
                          </VStack>
                        </HStack>
                      ))}
                    </Stack>
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
                    Totales
                  </Heading>
                  <Separator />
                  <HStack justify="space-between">
                    <Text color="#334155">Subtotal</Text>
                    <Text fontWeight="bold" fontSize="xl" color="#7b4e98">
                      {formatCurrency(cartSubtotal)}
                    </Text>
                  </HStack>

                  <Box
                    border="1px solid"
                    borderColor="blackAlpha.200"
                    borderRadius="xl"
                    p={3}
                    bg="rgba(244, 232, 255, 0.45)"
                  >
                    <VStack align="stretch" gap={3}>
                      <Text fontWeight="semibold" color="#0f172a">
                        Modalidad de entrega
                      </Text>
                      <Text color="#475569" fontSize="sm">
                        Elige como quieres recibir tu pedido para habilitar el checkout por WhatsApp.
                      </Text>
                      {hasGiftItems ? (
                        <Box borderRadius="lg" bg="#fdf2f8" border="1px solid" borderColor="#f9a8d4" p={3}>
                          <Text color="#9d174d" fontWeight="semibold" fontSize="sm">
                            Pedido con regalos
                          </Text>
                          <Text color="#9d174d" fontSize="xs" mt={1}>
                            Los regalos se envían al centro de recojo seleccionado. La entrega se coordina por WhatsApp,
                            por lo que este pedido debe retirarse en tienda.
                          </Text>
                        </Box>
                      ) : null}
                      <HStack align="stretch" gap={2}>
                        <Button
                          flex="1"
                          size="sm"
                          variant={deliveryMethod === 'pickup' ? 'solid' : 'outline'}
                          bg={deliveryMethod === 'pickup' ? '#7b4e98' : 'white'}
                          color={deliveryMethod === 'pickup' ? 'white' : '#513766'}
                          borderColor="#7b4e98"
                          _hover={{ bg: deliveryMethod === 'pickup' ? '#5c3275' : '#f8f1ff' }}
                          onClick={() => setDeliveryMethod('pickup')}
                        >
                          Retiro en tienda
                        </Button>
                        <Button
                          flex="1"
                          size="sm"
                          variant={deliveryMethod === 'courier' ? 'solid' : 'outline'}
                          bg={deliveryMethod === 'courier' ? '#7b4e98' : 'white'}
                          color={deliveryMethod === 'courier' ? 'white' : '#513766'}
                          borderColor="#7b4e98"
                          _hover={{ bg: deliveryMethod === 'courier' ? '#5c3275' : '#f8f1ff' }}
                          disabled={hasGiftItems}
                          onClick={() => {
                            setDeliveryMethod('courier')
                            setSelectedPickupStoreId('')
                          }}
                        >
                          Entrega por courier
                        </Button>
                      </HStack>

                      {deliveryMethod === 'pickup' ? (
                        <VStack align="stretch" gap={2}>
                          <Text color="#334155" fontSize="sm" fontWeight="medium">
                            Tienda para retiro
                          </Text>
                          <select
                            value={selectedPickupStoreId}
                            onChange={(event) => setSelectedPickupStoreId(event.target.value)}
                            disabled={isLoadingPickupStores || pickupStores.length === 0}
                            style={{
                              width: '100%',
                              borderRadius: '12px',
                              border: '1px solid #d8c4e3',
                              padding: '10px 12px',
                              background: '#ffffff',
                              color: '#513766',
                            }}
                          >
                            <option value="">Selecciona una tienda</option>
                            {pickupStores.map((store) => (
                              <option key={store.id} value={store.id}>
                                {store.name} - {store.district}
                              </option>
                            ))}
                          </select>
                          {selectedPickupStore ? (
                            <Text color="#64748b" fontSize="xs">
                              {selectedPickupStore.address} - {selectedPickupStore.district}
                            </Text>
                          ) : null}
                          {pickupStoresErrorMessage ? (
                            <Text color="#dc2626" fontSize="xs">
                              {pickupStoresErrorMessage}
                            </Text>
                          ) : null}
                        </VStack>
                      ) : null}
                    </VStack>
                  </Box>

                  <Box
                    border="1px solid"
                    borderColor="blackAlpha.200"
                    borderRadius="xl"
                    p={3}
                    bg="white"
                  >
                    <VStack align="stretch" gap={2}>
                      <Text fontWeight="semibold" color="#0f172a">
                        Datos del cliente
                      </Text>
                      <Input
                        placeholder="Celular de contacto"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        bg="white"
                      />
                      <Input
                        placeholder="Nombre"
                        value={referenceFirstName}
                        onChange={(event) => setReferenceFirstName(event.target.value)}
                        bg="white"
                      />
                      <Input
                        placeholder="Apellido"
                        value={referenceLastName}
                        onChange={(event) => setReferenceLastName(event.target.value)}
                        bg="white"
                      />
                      {!isCustomerInfoValid ? (
                        <Text color="#b91c1c" fontSize="xs">
                          Completa celular, nombre y apellido para habilitar WhatsApp.
                        </Text>
                      ) : null}
                    </VStack>
                  </Box>

                  <Button
                    bg="#7b4e98"
                    color="white"
                    _hover={{ bg: '#5c3275' }}
                    loading={isCheckoutLoading}
                    disabled={isCheckoutDisabled}
                    onClick={handleCheckout}
                  >
                    Finalizar por WhatsApp
                  </Button>
                </VStack>
              </Box>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
