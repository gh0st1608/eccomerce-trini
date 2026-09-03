import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { GetFeaturedProductsUseCase } from '@application/use-cases/GetFeaturedProductsUseCase'
import type { Product } from '@domain/entities/Product'
import { createProductRepository } from '@infrastructure/factories/createProductRepository'
import { InMemoryProductRepository } from '@infrastructure/repositories/InMemoryProductRepository'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { useCart } from '@presentation/providers/cart-context'

interface CategorySummary {
  name: string
  count: number
  product: Product | null
}

export function CategoriesPage() {
  const navigate = useNavigate()
  const { cartItemCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categories = useMemo<CategorySummary[]>(() => {
    const summaries = new Map<string, CategorySummary>()

    products.forEach((product) => {
      const current = summaries.get(product.category)

      if (!current) {
        summaries.set(product.category, {
          name: product.category,
          count: 1,
          product,
        })
        return
      }

      summaries.set(product.category, {
        ...current,
        count: current.count + 1,
      })
    })

    return Array.from(summaries.values())
  }, [products])

  useEffect(() => {
    async function loadCategories() {
      try {
        const repository = createProductRepository()
        const useCase = new GetFeaturedProductsUseCase(repository)
        const fetchedProducts = await useCase.execute()
        setProducts(fetchedProducts)
      } catch {
        const fallbackRepository = new InMemoryProductRepository()
        const fallbackProducts = await fallbackRepository.findFeatured()
        setProducts(fallbackProducts)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCategories()
  }, [])

  return (
    <Box minH="100dvh" className="app-bg">
      <StoreHeader
        searchTerm=""
        onSearchChange={() => undefined}
        totalProducts={categories.length}
        filteredProducts={categories.length}
        cartCount={cartItemCount}
        onCartClick={() => navigate('/cart')}
        showSearch={false}
        resultLabel="categorias"
        summaryText={`${categories.length} categorias disponibles`}
      />

      <Container maxW="7xl" py={{ base: 5, md: 10 }} pb={{ base: 20, md: 10 }}>
        <VStack align="stretch" gap={{ base: 4, md: 8 }}>
          <Stack gap={2}>
            <Text letterSpacing="0.14em" fontWeight="bold" textTransform="uppercase" color="#0f766e">
              Catalogos
            </Text>
            <Heading size={{ base: 'xl', md: '3xl' }} color="#0f172a" fontFamily="'Space Grotesk', sans-serif">
              Explora las categorias y entra al catalogo filtrado
            </Heading>
            <Text color="#334155" maxW="3xl">
              Cada categoria te lleva al home con el filtro aplicado para mantener una experiencia
              rapida y continua.
            </Text>
          </Stack>

          {isLoading ? (
            <Text color="#0f172a" fontWeight="semibold">
              Cargando categorias...
            </Text>
          ) : null}

          <SimpleGrid columns={{ base: 2, md: 2, xl: 3 }} gap={{ base: 3, md: 6 }}>
            {categories.map((category) => (
              <Box
                key={category.name}
                bg="rgba(255, 255, 255, 0.94)"
                border="1px solid"
                borderColor="blackAlpha.200"
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="lg"
              >
                <Box
                  height={{ base: '96px', md: '190px' }}
                  bgImage={`url(${category.product?.imageUrl ?? ''})`}
                  bgSize="cover"
                  backgroundPosition="center"
                  cursor="pointer"
                  role="button"
                  aria-label={`Ver productos de ${category.name}`}
                  onClick={() => navigate(`/?category=${encodeURIComponent(category.name)}`)}
                />
                <Stack p={{ base: 3, md: 5 }} gap={{ base: 2, md: 3 }}>
                  <HStack justify="space-between" align="start">
                    <Heading size={{ base: 'xs', md: 'md' }} color="#17222f" lineClamp={2}>
                      {category.name}
                    </Heading>
                    <Text color="#0f766e" fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                      {category.count}
                    </Text>
                  </HStack>
                  <Text color="#475569" fontSize={{ base: 'xs', md: 'md' }} display={{ base: 'none', md: 'block' }}>
                    Selecciona esta categoria para ver el catalogo filtrado en Home.
                  </Text>
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    bg="#0f172a"
                    color="white"
                    _hover={{ bg: '#1f2937' }}
                    onClick={() => navigate(`/?category=${encodeURIComponent(category.name)}`)}
                  >
                    Ver productos
                  </Button>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
