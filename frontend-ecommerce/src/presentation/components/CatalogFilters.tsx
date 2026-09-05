import { Badge, Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'

interface CatalogFiltersProps {
  minPrice: number
  maxPrice: number
  selectedMaxPrice: number
  onMaxPriceChange: (value: number) => void
  showFeaturedOnly: boolean
  onToggleFeaturedOnly: () => void
  onResetFilters: () => void
}

export function CatalogFilters({
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
          <Heading size={{ base: 'sm', md: 'md' }} color="#000000" fontWeight="800">
            Filtros
          </Heading>
          <Button
            size="xs"
            variant="ghost"
            color="#000000"
            fontWeight="800"
            onClick={onResetFilters}
          >
            Reset
          </Button>
        </HStack>

        <Stack gap={2}>
          <Text fontWeight="800" color="#000000">
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
            <Text fontSize="sm" color="#000000" fontWeight="800">
              ${minPrice}
            </Text>
            <Badge colorPalette="purple" color="#000000" fontWeight="800">
              Hasta ${selectedMaxPrice}
            </Badge>
          </HStack>
        </Stack>

        <Button
          size={{ base: 'sm', md: 'md' }}
          variant={showFeaturedOnly ? 'solid' : 'outline'}
          bg={showFeaturedOnly ? '#7b4e98' : 'white'}
          color={showFeaturedOnly ? 'white' : '#6b3d84'}
          fontWeight="800"
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
