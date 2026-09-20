import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { GetFeaturedProductsUseCase } from '@application/use-cases/GetFeaturedProductsUseCase'
import { ListCategoriesUseCase } from '@application/use-cases/ListCategoriesUseCase'
import { GetStorefrontSettingsUseCase } from '@application/use-cases/GetStorefrontSettingsUseCase'
import type { AdminCategory } from '@domain/entities/AdminCategory'
import type { Product } from '@domain/entities/Product'
import { defaultStorefrontSettings, type StorefrontSettings } from '@domain/entities/StorefrontSettings'
import { createCategoryRepository } from '@infrastructure/factories/createCategoryRepository'
import { createProductRepository } from '@infrastructure/factories/createProductRepository'
import { createStorefrontSettingsRepository } from '@infrastructure/factories/createStorefrontSettingsRepository'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { CatalogFilters } from '@presentation/components/CatalogFilters'
import { CatalogPromoBanner } from '@presentation/components/CatalogPromoBanner'
import { CategoryCarousel, type CarouselCategory } from '@presentation/components/CategoryCarousel'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { ProductCard } from '@presentation/components/ProductCard'
import { ProductDetailPanel } from '@presentation/components/ProductDetailPanel'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { useCart } from '@presentation/providers/cart-context'
import { useNavigate, useSearchParams } from 'react-router-dom'

function normalizeCategoryReference(value: string) {
  return value.trim().toLowerCase()
}

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const catalogRef = useRef<HTMLDivElement>(null)
  const requestedCategory = searchParams.get('category')
  const [products, setProducts] = useState<Product[]>([])
  const [categoryDefinitions, setCategoryDefinitions] = useState<AdminCategory[]>([])
  const [storefrontSettings, setStorefrontSettings] = useState<StorefrontSettings | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => requestedCategory ?? 'Todos')
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortMode, setSortMode] = useState<'featured' | 'priceAsc' | 'priceDesc'>('featured')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { cartItemsList, cartItemCount, addToCart } = useCart()

  const getFeaturedProductsUseCase = useMemo(() => {
    const repository = createProductRepository()
    return new GetFeaturedProductsUseCase(repository)
  }, [])

  const getStorefrontSettingsUseCase = useMemo(
    () => new GetStorefrontSettingsUseCase(createStorefrontSettingsRepository()),
    [],
  )

  const categoryDisplayNameBySlug = useMemo(
    () => new Map(
      categoryDefinitions.map((category) => [normalizeCategoryReference(category.slug), category.name]),
    ),
    [categoryDefinitions],
  )

  const productCategorySlugsByGeneralSlug = useMemo(() => {
    const activeCategories = categoryDefinitions.filter((category) => category.active)
    const generalCategories = activeCategories.filter((category) => !category.parentId)

    return new Map(
      generalCategories.map((generalCategory) => [
        normalizeCategoryReference(generalCategory.slug),
        new Set([
          normalizeCategoryReference(generalCategory.slug),
          ...activeCategories
            .filter((category) => category.parentId === generalCategory.id)
            .map((category) => normalizeCategoryReference(category.slug)),
        ]),
      ]),
    )
  }, [categoryDefinitions])

  const categories = useMemo<CarouselCategory[]>(() => {
    const categoryBySlug = new Map(
      categoryDefinitions.map((category) => [normalizeCategoryReference(category.slug), category]),
    )
    const activeGeneralCategories = categoryDefinitions.filter(
      (category) => category.active && !category.parentId,
    )

    return [
      { name: 'Todos', count: products.length },
      ...activeGeneralCategories
        .map((generalCategory) => {
          const includedSlugs = productCategorySlugsByGeneralSlug.get(
            normalizeCategoryReference(generalCategory.slug),
          ) ?? new Set<string>()
          const categoryProducts = products.filter((product) =>
            includedSlugs.has(normalizeCategoryReference(product.category)),
          )
          const childImage = Array.from(includedSlugs)
            .map((slug) => categoryBySlug.get(slug)?.imageUrl)
            .find(Boolean)

          return {
            name: generalCategory.name,
            value: generalCategory.slug,
            count: categoryProducts.length,
            imageUrl: generalCategory.imageUrl ?? childImage ?? categoryProducts[0]?.imageUrl,
          }
        })
        .filter((category) => category.count > 0),
    ]
  }, [categoryDefinitions, productCategorySlugsByGeneralSlug, products])

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
      const normalizedSelectedCategory = normalizeCategoryReference(selectedCategory)
      const selectedGeneralSlugs = productCategorySlugsByGeneralSlug.get(normalizedSelectedCategory)
      const normalizedProductCategory = normalizeCategoryReference(product.category)
      const categoryMatch =
        selectedCategory === 'Todos'
        || selectedGeneralSlugs?.has(normalizedProductCategory)
        || normalizedProductCategory === normalizedSelectedCategory
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
  }, [products, productCategorySlugsByGeneralSlug, searchTerm, selectedCategory, selectedMaxPrice, showFeaturedOnly, sortMode])

  const visibleSelectedProduct = useMemo(() => {
    if (!selectedProduct) {
      return filteredProducts[0] ?? null
    }

    return (
      filteredProducts.find((product) => product.id === selectedProduct.id) ??
      filteredProducts[0] ??
      null
    )
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

  useEffect(() => {
    async function loadCategories() {
      try {
        const useCase = new ListCategoriesUseCase(createCategoryRepository())
        setCategoryDefinitions(await useCase.execute())
      } catch {
        setCategoryDefinitions([])
      }
    }

    void loadCategories()
  }, [])

  useEffect(() => {
    async function loadStorefrontSettings() {
      try {
        setStorefrontSettings(await getStorefrontSettingsUseCase.execute())
      } catch {
        setStorefrontSettings(defaultStorefrontSettings)
      }
    }

    void loadStorefrontSettings()
  }, [getStorefrontSettingsUseCase])

  useEffect(() => {
    if (requestedCategory && !isLoading) {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isLoading, requestedCategory])

  function selectCategory(categoryName: string) {
    setSelectedCategory(categoryName)
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function resetFilters() {
    setSearchTerm('')
    setSelectedCategory('Todos')
    setSelectedMaxPrice(maxPrice)
    setShowFeaturedOnly(false)
    setSortMode('featured')
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
          {storefrontSettings ? (
            <CatalogPromoBanner
              banner={storefrontSettings.promoBanner}
              cartCount={cartItemCount}
              onShowOffers={() => setShowFeaturedOnly(true)}
              onOpenCart={() => navigate('/cart')}
            />
          ) : null}

          {errorMessage ? (
            <Alert.Root status="warning" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>API no disponible</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <CategoryCarousel categories={categories} onSelectCategory={selectCategory} />

          <Flex
            ref={catalogRef}
            id="catalogo-productos"
            scrollMarginTop={{ base: '72px', md: '96px' }}
            direction={{ base: 'column', xl: 'row' }}
            gap={{ base: 4, md: 6 }}
            align="start"
          >
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
                <HStack
                  justify="space-between"
                  align={{ base: 'start', md: 'center' }}
                  flexWrap="wrap"
                  gap={2}
                >
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
                      Menor precio
                    </Button>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant={sortMode === 'priceDesc' ? 'solid' : 'outline'}
                      bg={sortMode === 'priceDesc' ? '#4a1d63' : 'white'}
                      color={sortMode === 'priceDesc' ? 'white' : '#513766'}
                      onClick={() => setSortMode('priceDesc')}
                    >
                      Mayor precio
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
                      Limpiar.
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
                            categoryLabel={categoryDisplayNameBySlug.get(normalizeCategoryReference(product.category))}
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>

                  <VStack display={{ base: 'none', md: 'flex' }} align="stretch" gap={{ md: 5 }}>
                    {groupedProductsByCategory.map((group) => (
                      <Box key={group.category}>
                        <HStack justify="space-between" mb={2}>
                          <Text
                            fontWeight="bold"
                            color="#0f172a"
                            textTransform="capitalize"
                            fontSize={{ md: 'md' }}
                          >
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
                                  categoryLabel={categoryDisplayNameBySlug.get(normalizeCategoryReference(product.category))}
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
                quantityInCart={
                  visibleSelectedProduct ? (quantityByProductId[visibleSelectedProduct.id] ?? 0) : 0
                }
                onAddToCart={addToCart}
              />
            </Box>
          </Flex>

        </VStack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
