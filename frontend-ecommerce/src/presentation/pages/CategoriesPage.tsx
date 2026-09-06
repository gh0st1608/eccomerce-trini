import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { ListCategoriesUseCase } from '@application/use-cases/ListCategoriesUseCase'
import type { AdminCategory } from '@domain/entities/AdminCategory'
import { createCategoryRepository } from '@infrastructure/factories/createCategoryRepository'
import { MobileBottomNav } from '@presentation/components/MobileBottomNav'
import { StoreHeader } from '@presentation/components/StoreHeader'
import { useCart } from '@presentation/providers/cart-context'

export function CategoriesPage() {
  const navigate = useNavigate()
  const { cartItemCount } = useCart()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [selectedGeneralId, setSelectedGeneralId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories],
  )
  const generalCategories = useMemo(
    () => activeCategories.filter((category) => !category.parentId),
    [activeCategories],
  )
  const selectedGeneral = generalCategories.find((category) => category.id === selectedGeneralId)
  const specificCategories = useMemo(
    () => activeCategories.filter((category) => category.parentId === selectedGeneralId),
    [activeCategories, selectedGeneralId],
  )

  useEffect(() => {
    async function loadCategories() {
      try {
        const useCase = new ListCategoriesUseCase(createCategoryRepository())
        const fetchedCategories = await useCase.execute()
        const activeGeneralCategories = fetchedCategories.filter(
          (category) => category.active && !category.parentId,
        )
        const firstGeneral =
          activeGeneralCategories.find((generalCategory) =>
            fetchedCategories.some(
              (category) => category.active && category.parentId === generalCategory.id,
            ),
          ) ?? activeGeneralCategories[0]

        setCategories(fetchedCategories)
        setSelectedGeneralId(firstGeneral?.id ?? null)
      } catch {
        setHasError(true)
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
        totalProducts={specificCategories.length}
        filteredProducts={specificCategories.length}
        cartCount={cartItemCount}
        onCartClick={() => navigate('/cart')}
        showSearch={false}
        resultLabel="categorias"
        summaryText={`${specificCategories.length} categorias disponibles`}
      />

      <Container
        maxW="7xl"
        px={{ base: 3, md: 6 }}
        py={{ base: 5, md: 9 }}
        pb={{ base: 20, md: 10 }}
      >
        <Stack gap={{ base: 5, md: 8 }}>
          <Heading
            size={{ base: 'xl', md: '2xl' }}
            color="#17222f"
            fontFamily="'Space Grotesk', sans-serif"
          >
            Categorias
          </Heading>

          {isLoading ? <Text color="#475569">Cargando categorias...</Text> : null}
          {hasError ? <Text color="#b91c1c">No fue posible cargar las categorias.</Text> : null}

          {!isLoading && !hasError ? (
            <Flex align="stretch" gap={0}>
              <VStack
                as="nav"
                aria-label="Categorias generales"
                align="stretch"
                gap={1}
                width={{ base: '104px', sm: '132px', md: '220px' }}
                flexShrink={0}
                minH={{ base: '500px', md: '560px' }}
                bg="white"
                py={2}
                border="1px solid"
                borderColor="#eadff0"
                borderRadius="md"
                boxShadow="0 6px 18px rgba(74, 29, 99, 0.06)"
                overflow="hidden"
                position="sticky"
                top={{ base: '72px', md: '96px' }}
              >
                {generalCategories.map((category) => {
                  const isSelected = category.id === selectedGeneralId

                  return (
                    <Button
                      key={category.id}
                      minH={{ base: '48px', md: '52px' }}
                      px={{ base: 2, md: 4 }}
                      py={2}
                      borderLeft="3px solid"
                      borderColor={isSelected ? '#653d7d' : 'transparent'}
                      bg={isSelected ? '#f1e7f7' : 'transparent'}
                      color={isSelected ? '#4a1d63' : '#513766'}
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight={isSelected ? 'bold' : 'medium'}
                      textAlign="left"
                      justifyContent="flex-start"
                      whiteSpace="normal"
                      borderRadius={0}
                      variant="plain"
                      lineHeight="1.25"
                      cursor="pointer"
                      _hover={{ bg: '#f6effa', color: '#4a1d63' }}
                      onClick={() => setSelectedGeneralId(category.id)}
                    >
                      {category.name}
                    </Button>
                  )
                })}
              </VStack>

              <Box
                flex="1"
                minW={0}
                minH={{ base: '500px', md: '560px' }}
                ml={{ base: 2, md: 6 }}
                pl={{ base: 3, md: 8 }}
                borderLeft="1px solid"
                borderColor="#d8c6e3"
              >
                <Stack gap={1} mb={{ base: 4, md: 6 }}>
                  <Text
                    color="#7b4e98"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                  >
                    Explora la coleccion
                  </Text>
                  <Heading
                    size={{ base: 'md', md: 'xl' }}
                    color="#2b123d"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    {selectedGeneral?.name ?? 'Categorias especificas'}
                  </Heading>
                  <Box width="40px" height="3px" bg="#7b4e98" borderRadius="full" />
                </Stack>

                {specificCategories.length > 0 ? (
                  <SimpleGrid columns={{ base: 2, lg: 3 }} gap={{ base: 3, md: 6 }}>
                    {specificCategories.map((category) => (
                      <Button
                        key={category.id}
                        width="100%"
                        height="auto"
                        p={0}
                        display="block"
                        bg="transparent"
                        borderRadius="md"
                        textAlign="left"
                        cursor="pointer"
                        onClick={() => navigate(`/?category=${encodeURIComponent(category.slug)}`)}
                        aria-label={`Ver productos de ${category.name}`}
                      >
                        <Box
                          width="100%"
                          aspectRatio="4 / 5"
                          bg={category.imageUrl ? '#e2e8f0' : '#dbe7e3'}
                          bgImage={category.imageUrl ? `url(${category.imageUrl})` : undefined}
                          bgSize="cover"
                          backgroundPosition="center"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="#eadff0"
                          overflow="hidden"
                          boxShadow="0 7px 20px rgba(74, 29, 99, 0.12)"
                          transition="transform 180ms ease, box-shadow 180ms ease"
                          _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 28px rgba(74, 29, 99, 0.2)',
                          }}
                        />
                        <Text
                          mt={2}
                          color="#4a1d63"
                          fontWeight="bold"
                          fontSize={{ base: 'sm', md: 'md' }}
                          lineClamp={2}
                        >
                          {category.name}
                        </Text>
                      </Button>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box borderTop="1px solid" borderColor="#cbd5e1" py={6}>
                    <Text color="#64748b">
                      Esta categoria general aun no tiene categorias especificas.
                    </Text>
                  </Box>
                )}
              </Box>
            </Flex>
          ) : null}
        </Stack>
      </Container>

      <MobileBottomNav cartCount={cartItemCount} />
    </Box>
  )
}
