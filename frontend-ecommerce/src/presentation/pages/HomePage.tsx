import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
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
import { createProductRepository } from '@infrastructure/factories/createProductRepository'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { CatalogFilters } from '@presentation/components/CatalogFilters'
import { CategoryCarousel, type CarouselCategory } from '@presentation/components/CategoryCarousel'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { ProductCard } from '@presentation/components/ProductCard'
import { ProductDetailPanel } from '@presentation/components/ProductDetailPanel'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { useCart } from '@presentation/providers/cart-context'
import { formatCurrency } from '@shared/utils/currency'
import { registerCheckoutOrder } from '@shared/utils/adminOrderHistory'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? 'Todos')
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortMode, setSortMode] = useState<'featured' | 'priceAsc' | 'priceDesc'>('featured')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [referenceFirstName, setReferenceFirstName] = useState('')
  const [referencePaternalLastName, setReferencePaternalLastName] = useState('')
  const [referenceMaternalLastName, setReferenceMaternalLastName] = useState('')
  const { cartItemsList, cartItemCount, cartSubtotal, addToCart, removeFromCart, clearCart } =
    useCart()

  const getFeaturedProductsUseCase = useMemo(() => {
    const repository = createProductRepository()
    return new GetFeaturedProductsUseCase(repository)
  }, [])

  const generateCheckoutUrlUseCase = useMemo(() => {
    const checkoutGateway = createCheckoutGateway()
    return new GenerateCheckoutUrlUseCase(checkoutGateway)
  }, [])

  const categories = useMemo<CarouselCategory[]>(() => {
    const categorySet = new Set(products.map((product) => product.category))
    return [
      { name: 'Todos', count: products.length },
      ...Array.from(categorySet).map((name) => ({
        name,
        count: products.filter((product) => product.category === name).length,
        imageUrl: products.find((product) => product.category === name)?.imageUrl,
      })),
    ]
  }, [products])

  const minPrice = useMemo(() => {
    if (products.length === 0) return 0
    return Math.floor(Math.min(...products.map((product) => product.price)))
  }, [products])

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 0
    return Math.ceil(Math.max(...products.map((product) => product.price)))
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()

    const list = products.filter((product) => {
      const categoryMatch = selectedCategory === 'Todos' || product.category === selectedCategory
      const priceMatch = product.price <= selectedMaxPrice
      const featuredMatch = showFeaturedOnly ? product.featured : true
      const searchMatch =
        normalizedSearchTerm.length === 0
          ? true
          : product.name.toLowerCase().includes(normalizedSearchTerm) ||
            product.description.toLowerCase().includes(normalizedSearchTerm) ||
            product.category.toLowerCase().includes(normalizedSearchTerm)

      return categoryMatch && priceMatch && featuredMatch && searchMatch
    })

    if (sortMode === 'priceAsc') {
      return [...list].sort((a, b) => a.price - b.price)
    }

    if (sortMode === 'priceDesc') {
      return [...list].sort((a, b) => b.price - a.price)
    }

    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured))
  }, [products, searchTerm, selectedCategory, selectedMaxPrice, showFeaturedOnly, sortMode])

  const visibleSelectedProduct = useMemo(() => {
    if (!selectedProduct) {
      return filteredProducts[0] ?? null
    }

    return filteredProducts.find((product) => product.id === selectedProduct.id) ?? filteredProducts[0] ?? null
  }, [filteredProducts, selectedProduct])

  const groupedProductsByCategory = useMemo(() => {
    const categoryMap = new Map<string, Product[]>()

    filteredProducts.forEach((product) => {
      const currentProducts = categoryMap.get(product.category) ?? []
      categoryMap.set(product.category, [...currentProducts, product])
    })

    return Array.from(categoryMap.entries()).map(([category, categoryProducts]) => ({
      category,
      products: categoryProducts,
    }))
  }, [filteredProducts])

  const quantityByProductId = useMemo(() => {
    return cartItemsList.reduce<Record<string, number>>((acc, item) => {
      acc[item.product.id] = (acc[item.product.id] ?? 0) + item.quantity
      return acc
    }, {})
  }, [cartItemsList])

  const isCustomerInfoValid = useMemo(() => {
    return (
      customerPhone.trim().length >= 6
      && referenceFirstName.trim().length >= 2
      && referencePaternalLastName.trim().length >= 2
      && referenceMaternalLastName.trim().length >= 2
    )
  }, [customerPhone, referenceFirstName, referencePaternalLastName, referenceMaternalLastName])

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getFeaturedProductsUseCase.execute()
        const maxFetchedPrice =
          fetchedProducts.length > 0
            ? Math.ceil(Math.max(...fetchedProducts.map((product) => product.price)))
            : 0
        setProducts(fetchedProducts)
        setSelectedProduct(fetchedProducts[0] ?? null)
        setSelectedMaxPrice(maxFetchedPrice)
      } catch {
        const fallbackRepository = new InMemoryProductRepository()
        const fallbackProducts = await fallbackRepository.findFeatured()
        const maxFallbackPrice =
          fallbackProducts.length > 0
            ? Math.ceil(Math.max(...fallbackProducts.map((product) => product.price)))
            : 0
        setProducts(fallbackProducts)
        setSelectedProduct(fallbackProducts[0] ?? null)
        setSelectedMaxPrice(maxFallbackPrice)
        setErrorMessage('Mostrando catalogo local temporal por indisponibilidad de API.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProducts()
  }, [getFeaturedProductsUseCase])

  function resetFilters() {
    setSearchTerm('')
    setSelectedCategory('Todos')
    setSelectedMaxPrice(maxPrice)
    setShowFeaturedOnly(false)
    setSortMode('featured')
  }

  async function handleCheckout() {
    if (cartItemsList.some((item) => item.isGift)) {
      navigate('/cart')
      return
    }

    try {
      setIsCheckoutLoading(true)
      setCheckoutErrorMessage('')

      const checkoutItems: CheckoutItem[] = cartItemsList.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        isGift: item.isGift,
      }))

      const checkoutCustomer: CheckoutCustomer = {
        phone: customerPhone.trim(),
        firstName: referenceFirstName.trim(),
        paternalLastName: referencePaternalLastName.trim(),
        maternalLastName: referenceMaternalLastName.trim(),
      }

      const checkoutLinks = await generateCheckoutUrlUseCase.execute(
        checkoutItems,
        { method: 'courier' },
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
        referenceLastName: `${checkoutCustomer.paternalLastName} ${checkoutCustomer.maternalLastName}`,
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalProducts={products.length}
        filteredProducts={filteredProducts.length}
        cartCount={cartItemCount}
        onCartClick={() => navigate('/cart')}
      />

      <Container maxW="7xl" py={{ base: 4, md: 10 }} pb={{ base: 20, md: 10 }}>
        <VStack align="stretch" gap={{ base: 4, md: 8 }}>
          <Box
            position="relative"
            overflow="hidden"
            borderRadius={{ base: '2xl', md: '3xl' }}
            px={{ base: 5, sm: 7, md: 10 }}
            py={{ base: 6, md: 9 }}
            bg="linear-gradient(118deg, #2b123d 0%, #673b7d 50%, #b697d3 100%)"
            boxShadow="0 24px 50px rgba(74, 29, 99, 0.26)"
          >
            <Box
              position="absolute"
              width={{ base: '180px', md: '300px' }}
              height={{ base: '180px', md: '300px' }}
              borderRadius="full"
              bg="rgba(244, 232, 255, 0.25)"
              right={{ base: '-96px', md: '10%' }}
              top={{ base: '-100px', md: '-145px' }}
            />
            <Box
              position="absolute"
              width={{ base: '150px', md: '230px' }}
              height={{ base: '150px', md: '230px' }}
              borderRadius="full"
              border="1px solid rgba(255, 255, 255, 0.22)"
              right={{ base: '-62px', md: '-34px' }}
              bottom={{ base: '-92px', md: '-115px' }}
            />

            <Flex
              position="relative"
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 5, md: 8 }}
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
            >
              <Stack gap={{ base: 3, md: 4 }} maxW="2xl">
                <Text
                  color="#f4e8ff"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  OFERTA DE TEMPORADA
                </Text>
                <Heading
                  color="white"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize={{ base: '2xl', sm: '3xl', md: '5xl' }}
                  lineHeight="1"
                >
                  Hasta 30% OFF en prendas seleccionadas
                </Heading>
                <Text color="#f4e8ff" fontSize={{ base: 'sm', md: 'lg' }} maxW="xl">
                  Encuentra tus favoritos de Mayo Collection con precios especiales por tiempo limitado.
                </Text>
                <HStack gap={3} wrap="wrap">
                  <Button
                    bg="#f4e8ff"
                    color="#4a1d63"
                    _hover={{ bg: '#ffffff' }}
                    onClick={() => setShowFeaturedOnly(true)}
                  >
                    Ver ofertas
                  </Button>
                  <Button
                    variant="outline"
                    borderColor="rgba(255, 255, 255, 0.55)"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => navigate('/cart')}
                  >
                    Carrito ({cartItemCount})
                  </Button>
                </HStack>
              </Stack>

              <Box
                display={{ base: 'none', md: 'block' }}
                minW="210px"
                borderRadius="2xl"
                bg="rgba(255, 255, 255, 0.12)"
                border="1px solid rgba(255, 255, 255, 0.22)"
                p={5}
                backdropFilter="blur(8px)"
              >
                <Text color="#f4e8ff" fontSize="xs" fontWeight="bold" letterSpacing="0.14em">
                  MAYO COLLECTION
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold" mt={2}>
                  SALE
                </Text>
                <Text color="#f4e8ff" fontSize="sm" mt={1}>
                  Estilos para todos los dias.
                </Text>
              </Box>
            </Flex>
          </Box>

          {errorMessage ? (
            <Alert.Root status="warning" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>API no disponible</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {checkoutErrorMessage ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Checkout no disponible</Alert.Title>
                <Alert.Description>{checkoutErrorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <CategoryCarousel
            categories={categories}
            onSelectCategory={setSelectedCategory}
          />

          <Flex direction={{ base: 'column', xl: 'row' }} gap={{ base: 4, md: 6 }} align="start">
            <Box width={{ base: '100%', xl: '280px' }}>
              <CatalogFilters
                minPrice={minPrice}
                maxPrice={maxPrice}
                selectedMaxPrice={selectedMaxPrice}
                onMaxPriceChange={setSelectedMaxPrice}
                showFeaturedOnly={showFeaturedOnly}
                onToggleFeaturedOnly={() => setShowFeaturedOnly((prev) => !prev)}
                onResetFilters={resetFilters}
              />
            </Box>

            <Box flex="1" width="100%">
              <Stack gap={{ base: 3, md: 5 }}>
                <HStack justify="space-between" align={{ base: 'start', md: 'center' }} flexWrap="wrap" gap={2}>
                  <HStack gap={3} flexWrap="wrap">
                    <Text color="#475569" fontWeight="medium" fontSize={{ base: 'sm', md: 'md' }}>
                      {filteredProducts.length} producto(s) disponibles
                    </Text>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant="outline"
                      borderColor="#0f766e"
                      color="#0f766e"
                      _hover={{ bg: '#0f766e', color: 'white' }}
                      onClick={() => navigate('/categories')}
                    >
                      Ver categorias
                    </Button>
                  </HStack>
                  <HStack gap={2}>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant={sortMode === 'featured' ? 'solid' : 'outline'}
                      bg={sortMode === 'featured' ? '#4a1d63' : 'white'}
                      color={sortMode === 'featured' ? 'white' : '#513766'}
                      onClick={() => setSortMode('featured')}
                    >
                      Relevancia
                    </Button>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant={sortMode === 'priceAsc' ? 'solid' : 'outline'}
                      bg={sortMode === 'priceAsc' ? '#4a1d63' : 'white'}
                      color={sortMode === 'priceAsc' ? 'white' : '#513766'}
                      onClick={() => setSortMode('priceAsc')}
                    >
                      Precio +
                    </Button>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant={sortMode === 'priceDesc' ? 'solid' : 'outline'}
                      bg={sortMode === 'priceDesc' ? '#4a1d63' : 'white'}
                      color={sortMode === 'priceDesc' ? 'white' : '#513766'}
                      onClick={() => setSortMode('priceDesc')}
                    >
                      Precio -
                    </Button>
                  </HStack>
                </HStack>

                {isLoading ? (
                  <Text color="#0f172a" fontWeight="semibold">
                    Cargando productos destacados...
                  </Text>
                ) : null}

                {!isLoading && filteredProducts.length === 0 ? (
                  <Box
                    borderRadius="2xl"
                    border="1px dashed"
                    borderColor="#cbd5e1"
                    bg="white"
                    p={{ base: 4, md: 6 }}
                  >
                    <Text color="#475569">
                      No encontramos resultados con los filtros actuales. Ajusta la busqueda o usa
                      Reset.
                    </Text>
                  </Box>
                ) : null}

                <VStack align="stretch" gap={{ base: 4, md: 5 }}>
                  <Box data-testid="category-mobile-grid" display={{ base: 'block', md: 'none' }}>
                    <SimpleGrid columns={2} gap={2}>
                      {filteredProducts.map((product) => (
                        <Box key={product.id} minW={0}>
                          <ProductCard
                            compact
                            product={product}
                            detailTo={`/products/${product.id}`}
                            onAddToCart={addToCart}
                            quantityInCart={quantityByProductId[product.id] ?? 0}
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>

                  <VStack display={{ base: 'none', md: 'flex' }} align="stretch" gap={{ md: 5 }}>
                    {groupedProductsByCategory.map((group) => (
                      <Box key={group.category}>
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold" color="#0f172a" textTransform="capitalize" fontSize={{ md: 'md' }}>
                            {group.category}
                          </Text>
                          <Text color="#64748b" fontSize="sm">
                            {group.products.length} producto(s)
                          </Text>
                        </HStack>

                        <Box overflowX="auto" pb={2}>
                          <Stack
                            direction="row"
                            gap={{ md: 4 }}
                            align="stretch"
                            flexWrap="nowrap"
                            scrollSnapType="x mandatory"
                          >
                            {group.products.map((product) => (
                              <Box
                                key={product.id}
                                minW={{ md: '360px', xl: '380px' }}
                                scrollSnapAlign="start"
                              >
                                <ProductCard
                                  product={product}
                                  detailTo={`/products/${product.id}`}
                                  onAddToCart={addToCart}
                                  quantityInCart={quantityByProductId[product.id] ?? 0}
                                />
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </Stack>
            </Box>

            <Box display={{ base: 'none', xl: 'block' }} width={{ base: '100%', xl: '380px' }}>
              <ProductDetailPanel
                product={visibleSelectedProduct}
                quantityInCart={visibleSelectedProduct ? (quantityByProductId[visibleSelectedProduct.id] ?? 0) : 0}
                onAddToCart={addToCart}
              />
            </Box>
          </Flex>

          <Box
            borderRadius="2xl"
            bg="rgba(255, 255, 255, 0.9)"
            border="1px solid"
            borderColor="blackAlpha.200"
            boxShadow="lg"
            p={{ base: 4, md: 5 }}
          >
            <VStack align="stretch" gap={{ base: 3, md: 4 }}>
              <Heading size={{ base: 'sm', md: 'md' }} color="#17222f">
                Carrito
              </Heading>
              <Text color="#475569">{cartItemCount} item(s) seleccionados</Text>
              <Separator />

              {cartItemsList.length === 0 ? (
                <Text color="#64748b">Aun no agregaste productos al carrito.</Text>
              ) : (
                <Stack gap={3}>
                  {cartItemsList.map((item) => (
                    <Box key={item.lineId}>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" gap={0.5}>
                          <Text fontWeight="semibold" color="#17222f">
                            {item.product.name}
                          </Text>
                          {item.selectedColor || item.selectedSize ? (
                            <Text fontSize="sm" color="#64748b">
                              {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                              {item.selectedColor && item.selectedSize ? ' · ' : ''}
                              {item.selectedSize ? `Talla: ${item.selectedSize}` : ''}
                            </Text>
                          ) : null}
                          <Text fontSize="sm" color="#64748b">
                            {item.quantity} x {formatCurrency(item.product.price)}
                          </Text>
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
                    </Box>
                  ))}
                </Stack>
              )}

              <Separator />
              <HStack justify="space-between">
                <Text fontWeight="medium" color="#334155">
                  Subtotal
                </Text>
                <Text fontWeight="bold" fontSize="xl" color="#6b3d84">
                  {formatCurrency(cartSubtotal)}
                </Text>
              </HStack>

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
                  placeholder="Apellido paterno"
                  value={referencePaternalLastName}
                  onChange={(event) => setReferencePaternalLastName(event.target.value)}
                  bg="white"
                />
                <Input
                  placeholder="Apellido materno"
                  value={referenceMaternalLastName}
                  onChange={(event) => setReferenceMaternalLastName(event.target.value)}
                  bg="white"
                />
                {!isCustomerInfoValid ? (
                  <Text color="#b91c1c" fontSize="xs">
                    Completa celular, nombre y ambos apellidos para habilitar WhatsApp.
                  </Text>
                ) : null}
              </VStack>

              <Button
                bg="#7b4e98"
                color="white"
                _hover={{ bg: '#5c3275' }}
                loading={isCheckoutLoading}
                disabled={cartItemsList.length === 0 || isCheckoutLoading || !isCustomerInfoValid}
                onClick={handleCheckout}
              >
                Finalizar por WhatsApp
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
