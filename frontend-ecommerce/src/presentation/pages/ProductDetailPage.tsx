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
  Image,
  Separator,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { GetProductByIdUseCase } from '@application/use-cases/GetProductByIdUseCase'
import type { Product } from '@domain/entities/Product'
import { createProductRepository } from '@infrastructure/factories/createProductRepository'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { useCart } from '@presentation/providers/cart-context'
import { formatCurrency } from '@shared/utils/currency'
import { getProductGalleryImages } from '@shared/utils/productGallery'

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const { cartItemCount, addToCart, cartItemsList } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const getProductByIdUseCase = useMemo(() => {
    const repository = createProductRepository()
    return new GetProductByIdUseCase(repository)
  }, [])

  const quantityInCart = useMemo(() => {
    if (!productId) {
      return 0
    }

    return cartItemsList
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItemsList, productId])
  const galleryImages = useMemo(() => {
    if (!product) {
      return []
    }

    return getProductGalleryImages(product)
  }, [product])

  const hasColorOptions = Boolean(product?.colors?.length)
  const hasSizeOptions = Boolean(product?.sizes?.length)
  const selectedOptionsAreValid =
    (!hasColorOptions || selectedColor.length > 0) && (!hasSizeOptions || selectedSize.length > 0)
  const isSoldOut = typeof product?.stock === 'number' && product.stock <= 0
  const maxSelectableQuantity = typeof product?.stock === 'number' ? Math.max(product.stock, 0) : 20
  const discountPercent =
    product?.discountPercent ??
    (product?.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : undefined)
  const originalPrice =
    product?.originalPrice ??
    (discountPercent && discountPercent < 100 && typeof product?.price === 'number'
      ? product.price / (1 - discountPercent / 100)
      : undefined)

  useEffect(() => {
    setSelectedImageIndex(0)
    setSelectedColor('')
    setSelectedSize('')
    setSelectedQuantity(1)
  }, [productId])

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setErrorMessage('Producto no encontrado.')
        setIsLoading(false)
        return
      }

      const fallbackRepository = new InMemoryProductRepository()
      const fallbackProduct = await fallbackRepository.findById(productId)

      if (fallbackProduct) {
        setProduct(fallbackProduct)
      }

      setIsLoading(false)

      try {
        setErrorMessage('')
        const fetchedProduct = await getProductByIdUseCase.execute(productId)
        if (fetchedProduct) {
          setProduct(fetchedProduct)
          return
        }

        if (!fallbackProduct) {
          setErrorMessage('No se encontro el producto solicitado.')
        }
      } catch {
        if (!fallbackProduct) {
          setErrorMessage('No se pudo cargar el detalle del producto.')
        }
      }
    }

    void loadProduct()
  }, [getProductByIdUseCase, productId])

  return (
    <Box minH="100dvh" className="app-bg">
      <StoreHeader
        searchTerm=""
        onSearchChange={() => undefined}
        totalProducts={1}
        filteredProducts={1}
        cartCount={cartItemCount}
        onCartClick={() => navigate('/cart')}
        showSearch={false}
      />

      <Container maxW="6xl" py={{ base: 5, md: 10 }} pb={{ base: 20, md: 10 }}>
        <VStack align="stretch" gap={{ base: 4, md: 6 }}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Stack gap={1}>
              <Text
                letterSpacing="0.14em"
                fontWeight="bold"
                textTransform="uppercase"
                color="#0f766e"
              >
                Detalle de producto
              </Text>
              <Heading
                size={{ base: 'xl', md: '3xl' }}
                color="#0f172a"
                fontFamily="'Space Grotesk', sans-serif"
              >
                {product?.name ?? 'Cargando detalle'}
              </Heading>
            </Stack>
            <Button variant="outline" borderColor="#cbd5e1" onClick={() => navigate(-1)}>
              Volver
            </Button>
          </HStack>

          {errorMessage ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Producto no disponible</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {isLoading ? (
            <Text color="#0f172a" fontWeight="semibold">
              Cargando detalle del producto...
            </Text>
          ) : null}

          {product ? (
            <Flex direction={{ base: 'column', xl: 'row' }} gap={6} align="start">
              <Box flex="1" width="100%">
                <Box
                  bg="rgba(255, 255, 255, 0.95)"
                  border="1px solid"
                  borderColor="blackAlpha.200"
                  borderRadius="2xl"
                  p={{ base: 3, md: 4 }}
                  boxShadow="lg"
                >
                  <Box
                    display={{ base: 'block', md: 'none' }}
                    position="relative"
                    overflow="hidden"
                    borderRadius="xl"
                  >
                    <Flex
                      aria-label={`Galeria de ${product.name}`}
                      overflowX="auto"
                      scrollSnapType="x mandatory"
                      overscrollBehaviorX="contain"
                      scrollbarWidth="none"
                    >
                      {galleryImages.map((imageUrl, index) => (
                        <Image
                          key={`${imageUrl}-mobile-${index}`}
                          src={imageUrl}
                          alt={`${product.name} vista ${index + 1}`}
                          flex="0 0 100%"
                          width="100%"
                          aspectRatio="4 / 5"
                          objectFit="cover"
                          objectPosition="center"
                          bg="white"
                          scrollSnapAlign="start"
                        />
                      ))}
                    </Flex>
                    {galleryImages.length > 1 ? (
                      <Badge
                        position="absolute"
                        right={3}
                        bottom={3}
                        borderRadius="full"
                        bg="whiteAlpha.900"
                        color="#334155"
                      >
                        Desliza para ver mas
                      </Badge>
                    ) : null}
                  </Box>

                  <Flex
                    display={{ base: 'none', md: 'flex' }}
                    direction="row"
                    gap={3}
                    align="start"
                  >
                    {galleryImages.length > 1 ? (
                      <Stack direction="column" gap={3} maxW="96px">
                        {galleryImages.map((imageUrl, index) => (
                          <Button
                            key={`${imageUrl}-${index}`}
                            variant="outline"
                            borderColor={
                              selectedImageIndex === index ? '#0f766e' : 'blackAlpha.200'
                            }
                            borderWidth={selectedImageIndex === index ? '2px' : '1px'}
                            p={0}
                            minW="88px"
                            h="88px"
                            overflow="hidden"
                            borderRadius="xl"
                            bg="white"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <Image
                              src={imageUrl}
                              alt={`${product.name} vista ${index + 1}`}
                              objectFit="cover"
                              objectPosition="center"
                              width="100%"
                              height="100%"
                            />
                          </Button>
                        ))}
                      </Stack>
                    ) : null}

                    <Box flex="1" width="100%" position="relative">
                      <Image
                        src={galleryImages[selectedImageIndex] ?? product.imageUrl}
                        alt={product.name}
                        width="100%"
                        aspectRatio="4 / 5"
                        maxHeight="680px"
                        objectFit="cover"
                        objectPosition="center"
                        bg="white"
                        borderRadius="xl"
                      />
                      {discountPercent ? (
                        <Badge
                          position="absolute"
                          top={3}
                          left={3}
                          px={3}
                          py={1}
                          borderRadius="full"
                          colorPalette="red"
                        >
                          -{discountPercent}%
                        </Badge>
                      ) : null}
                    </Box>
                  </Flex>
                </Box>
              </Box>

              <Box width={{ base: '100%', xl: '420px' }}>
                <Box
                  bg="rgba(255, 255, 255, 0.95)"
                  border="1px solid"
                  borderColor="blackAlpha.200"
                  borderRadius="2xl"
                  p={{ base: 4, md: 6 }}
                  boxShadow="xl"
                  position={{ base: 'static', xl: 'sticky' }}
                  top={{ xl: 24 }}
                >
                  <VStack align="stretch" gap={4}>
                    <HStack justify="space-between" align="start">
                      <Badge px={3} py={1} borderRadius="full" colorPalette="cyan">
                        {product.category}
                      </Badge>
                      {product.featured ? (
                        <Badge px={3} py={1} borderRadius="full" colorPalette="teal">
                          Destacado
                        </Badge>
                      ) : null}
                    </HStack>

                    <Heading size="lg" color="#0f172a">
                      {product.name}
                    </Heading>

                    <Text color="#334155" fontSize="lg">
                      {product.description}
                    </Text>

                    <Separator />

                    <VStack align="stretch" gap={1}>
                      <HStack justify="space-between" align="baseline">
                        <Text color="#475569">Precio</Text>
                        <Text fontWeight="bold" fontSize="2xl" color="#0f766e">
                          {formatCurrency(product.price)}
                        </Text>
                      </HStack>
                      {originalPrice && originalPrice > product.price ? (
                        <HStack justify="space-between" color="#64748b" fontSize="sm">
                          <Text>Antes</Text>
                          <HStack gap={2}>
                            <Text textDecoration="line-through">
                              {formatCurrency(originalPrice)}
                            </Text>
                            <Badge colorPalette="red" borderRadius="full">
                              Oferta
                            </Badge>
                          </HStack>
                        </HStack>
                      ) : null}
                    </VStack>

                    {hasColorOptions ? (
                      <VStack align="stretch" gap={2}>
                        <Text color="#334155" fontWeight="semibold">
                          Color
                        </Text>
                        <HStack gap={2} flexWrap="wrap">
                          {product.colors?.map((color) => (
                            <Button
                              key={color}
                              size="sm"
                              variant={selectedColor === color ? 'solid' : 'outline'}
                              bg={selectedColor === color ? '#0f766e' : 'white'}
                              color={selectedColor === color ? 'white' : '#0f172a'}
                              borderColor="#cbd5e1"
                              onClick={() => setSelectedColor(color)}
                            >
                              {color}
                            </Button>
                          ))}
                        </HStack>
                      </VStack>
                    ) : null}

                    {hasSizeOptions ? (
                      <VStack align="stretch" gap={2}>
                        <Text color="#334155" fontWeight="semibold">
                          Talla
                        </Text>
                        <HStack gap={2} flexWrap="wrap">
                          {product.sizes?.map((size) => (
                            <Button
                              key={size}
                              size="sm"
                              variant={selectedSize === size ? 'solid' : 'outline'}
                              bg={selectedSize === size ? '#0f766e' : 'white'}
                              color={selectedSize === size ? 'white' : '#0f172a'}
                              borderColor="#cbd5e1"
                              minW="56px"
                              onClick={() => setSelectedSize(size)}
                            >
                              {size}
                            </Button>
                          ))}
                        </HStack>
                      </VStack>
                    ) : null}

                    <VStack align="stretch" gap={2}>
                      <Text color="#334155" fontWeight="semibold">
                        Cantidad
                      </Text>
                      <HStack gap={3}>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="#cbd5e1"
                          disabled={selectedQuantity <= 1 || isSoldOut}
                          onClick={() => setSelectedQuantity((current) => Math.max(1, current - 1))}
                        >
                          -
                        </Button>
                        <Text minW="28px" textAlign="center" fontWeight="semibold">
                          {selectedQuantity}
                        </Text>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="#cbd5e1"
                          disabled={isSoldOut || selectedQuantity >= maxSelectableQuantity}
                          onClick={() =>
                            setSelectedQuantity((current) =>
                              Math.min(maxSelectableQuantity, current + 1),
                            )
                          }
                        >
                          +
                        </Button>
                        {typeof product.stock === 'number' ? (
                          <Text fontSize="sm" color="#64748b">
                            Stock: {product.stock}
                          </Text>
                        ) : null}
                      </HStack>
                    </VStack>

                    <HStack justify="space-between">
                      <Text color="#475569">SKU</Text>
                      <Text fontWeight="semibold" color="#0f172a">
                        {product.sku ?? product.id}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text color="#475569">Moneda</Text>
                      <Text fontWeight="semibold" color="#0f172a">
                        {!product.currency || product.currency === 'PEN'
                          ? 'Soles (PEN)'
                          : product.currency}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text color="#475569">En carrito</Text>
                      <Text fontWeight="semibold" color="#0f172a">
                        {quantityInCart}
                      </Text>
                    </HStack>

                    <Button
                      bg="#0f766e"
                      color="white"
                      _hover={{ bg: '#115e59' }}
                      disabled={!selectedOptionsAreValid || isSoldOut}
                      onClick={() =>
                        addToCart(product, selectedQuantity, {
                          color: selectedColor,
                          size: selectedSize,
                        })
                      }
                    >
                      {isSoldOut
                        ? 'Agotado'
                        : selectedOptionsAreValid
                          ? 'Agregar al carrito'
                          : 'Elige tus opciones'}
                    </Button>
                  </VStack>
                </Box>
              </Box>
            </Flex>
          ) : null}
        </VStack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
