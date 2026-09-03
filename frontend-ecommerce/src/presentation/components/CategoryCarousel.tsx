import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'

export interface CarouselCategory {
  name: string
  count: number
  imageUrl?: string
}

interface CategoryCarouselProps {
  categories: CarouselCategory[]
  onSelectCategory: (categoryName: string) => void
}

export function CategoryCarousel({ categories, onSelectCategory }: CategoryCarouselProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <Box
      aria-label="Categorias disponibles para seguir comprando"
      overflowX="auto"
      pb={1}
      css={{
        scrollbarWidth: 'thin',
        scrollSnapType: 'x mandatory',
      }}
    >
      <HStack gap={{ base: 3, md: 5 }} align="start" width="max-content" pr={2}>
        {categories.map((category) => (
          <Button
            key={category.name}
            aria-label={`Ver productos de ${category.name}`}
            variant="ghost"
            height="auto"
            minW="0"
            p={0}
            borderRadius="full"
            color="#3f1d50"
            _hover={{ bg: 'transparent', color: '#6f3f88' }}
            onClick={() => onSelectCategory(category.name)}
            css={{ scrollSnapAlign: 'start' }}
          >
            <Stack align="center" gap={2} width={{ base: '76px', md: '96px' }}>
              <Box
                width={{ base: '66px', md: '84px' }}
                height={{ base: '66px', md: '84px' }}
                borderRadius="full"
                overflow="hidden"
                border="3px solid"
                borderColor="#d5b8ee"
                bg="linear-gradient(135deg, #f4e8ff 0%, #d5b8ee 100%)"
                boxShadow="0 8px 18px rgba(87, 43, 111, 0.18)"
                flexShrink={0}
              >
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    width="100%"
                    height="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="#5c3275"
                    fontWeight="extrabold"
                    fontSize={{ base: 'lg', md: 'xl' }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Box>
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" lineClamp={1} textAlign="center" width="100%">
                {category.name}
              </Text>
              <Text color="#76538a" fontSize="xs" lineHeight="1" whiteSpace="nowrap">
                {category.count} {category.count === 1 ? 'producto' : 'productos'}
              </Text>
            </Stack>
          </Button>
        ))}
      </HStack>
    </Box>
  )
}
