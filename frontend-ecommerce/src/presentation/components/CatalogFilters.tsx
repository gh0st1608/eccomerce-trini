import { Badge, Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'

interface CatalogFiltersProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  minPrice: number
  maxPrice: number
  selectedMaxPrice: number
  onMaxPriceChange: (value: number) => void
  showFeaturedOnly: boolean
  onToggleFeaturedOnly: () => void
  onResetFilters: () => void
}

export function CatalogFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  minPrice,
  maxPrice,
  selectedMaxPrice,
  onMaxPriceChange,
  showFeaturedOnly,
  onToggleFeaturedOnly,
  onResetFilters,
}: CatalogFiltersProps) {
  return (
    <Box
      bg="rgba(255, 252, 255, 0.94)"
      border="1px solid"
      borderColor="#e3d3eb"
      borderRadius="2xl"
      p={{ base: 3, md: 5 }}
      boxShadow="lg"
      position={{ base: 'static', xl: 'sticky' }}
      top={{ xl: 24 }}
    >
      <Stack gap={{ base: 3, md: 5 }}>
        <HStack justify="space-between">
          <Heading size={{ base: 'sm', md: 'md' }} color="#2b123d">
            Filtros
          </Heading>
          <Button size="xs" variant="ghost" onClick={onResetFilters}>
            Reset
          </Button>
        </HStack>

        <Stack gap={2}>
          <Text fontWeight="semibold" color="#334155">
            Categoria
          </Text>
          <HStack gap={2} wrap="wrap">
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <Button
                  key={category}
                  size={{ base: 'xs', md: 'sm' }}
                  borderRadius="full"
                  variant={isActive ? 'solid' : 'outline'}
                  bg={isActive ? '#4a1d63' : 'white'}
                  color={isActive ? 'white' : '#513766'}
                  borderColor="#dcc9e6"
                  _hover={isActive ? { bg: '#351344' } : { bg: '#f7effa' }}
                  onClick={() => onSelectCategory(category)}
                >
                  {category}
                </Button>
              )
            })}
          </HStack>
        </Stack>

        <Stack gap={2}>
          <Text fontWeight="semibold" color="#334155">
            Precio maximo
          </Text>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={selectedMaxPrice}
            onChange={(event) => onMaxPriceChange(Number(event.target.value))}
          />
          <HStack justify="space-between">
            <Text fontSize="sm" color="#64748b">
              ${minPrice}
            </Text>
            <Badge colorPalette="purple">Hasta ${selectedMaxPrice}</Badge>
          </HStack>
        </Stack>

        <Button
          size={{ base: 'sm', md: 'md' }}
          variant={showFeaturedOnly ? 'solid' : 'outline'}
          bg={showFeaturedOnly ? '#7b4e98' : 'white'}
          color={showFeaturedOnly ? 'white' : '#6b3d84'}
          borderColor="#7b4e98"
          _hover={showFeaturedOnly ? { bg: '#5c3275' } : { bg: '#f4eafa' }}
          onClick={onToggleFeaturedOnly}
        >
          Solo destacados
        </Button>
      </Stack>
    </Box>
  )
}
