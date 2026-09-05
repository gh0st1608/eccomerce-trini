import { useRef } from 'react'
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Input,
  Separator,
  Stack,
  Text,
} from '@chakra-ui/react'
import { BrandLogo } from '@presentation/components/BrandLogo'
import { SearchIcon } from '@presentation/components/UiIcons'

interface StoreHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  totalProducts: number
  filteredProducts: number
  cartCount: number
  onCartClick: () => void
  showSearch?: boolean
  resultLabel?: string
  summaryText?: string
}

export function StoreHeader({
  searchTerm,
  onSearchChange,
  totalProducts,
  filteredProducts,
  cartCount,
  onCartClick,
  showSearch = true,
  resultLabel = 'resultados',
  summaryText,
}: StoreHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <Box as="header" position="sticky" top={0} zIndex={20} boxShadow="sm">
      <Box bg="#fffaff" borderBottom="1px solid" borderColor="#eadff0" py={{ base: 3, md: 5 }}>
        <Container maxW="7xl">
          <Grid
            templateColumns={{ base: '1fr', lg: 'auto 1fr auto' }}
            gap={{ base: 2.5, md: 4 }}
            alignItems="center"
          >
            <GridItem>
              <BrandLogo size={54} showText />
            </GridItem>

            {showSearch ? (
              <GridItem>
                <HStack gap={0}>
                  <Input
                    ref={searchInputRef}
                    flex="1"
                    minW={0}
                    size={{ base: 'sm', md: 'md' }}
                    bg="#fcf9fe"
                    borderColor="#d8c4e3"
                    borderRightRadius={0}
                    fontWeight="semibold"
                    placeholder="Buscar por producto, categoria o descripcion"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                  />
                  <Button
                    aria-label="Buscar productos"
                    size={{ base: 'sm', md: 'md' }}
                    borderLeftRadius={0}
                    bg="#4a1d63"
                    color="white"
                    _hover={{ bg: '#351344' }}
                    onClick={() => searchInputRef.current?.focus()}
                  >
                    <SearchIcon />
                  </Button>
                </HStack>
              </GridItem>
            ) : null}

            <GridItem>
              <HStack justify={{ base: 'start', lg: 'end' }} gap={2}>
                <Button
                  size={{ base: 'sm', md: 'md' }}
                  variant="outline"
                  borderColor="#d8c4e3"
                  color="#4a1d63"
                  disabled
                >
                  Cuenta
                </Button>
                <Button
                  size={{ base: 'sm', md: 'md' }}
                  bg="#4a1d63"
                  color="white"
                  _hover={{ bg: '#351344' }}
                  onClick={onCartClick}
                >
                  Carrito ({cartCount})
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      <Box bg="#fffaff" borderBottom="1px solid" borderColor="#eadff0" py={{ base: 2, md: 3 }}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center" wrap="wrap" gap={{ base: 2, md: 3 }}>
            <HStack gap={2} wrap="wrap">
              <Badge
                bg="#f0e3f7"
                color="#653d7d"
                px={{ base: 2.5, md: 3 }}
                py={{ base: 1, md: 1.5 }}
                borderRadius="full"
              >
                Catalogo curado
              </Badge>
              <Badge
                colorPalette="orange"
                px={{ base: 2.5, md: 3 }}
                py={{ base: 1, md: 1.5 }}
                borderRadius="full"
              >
                {filteredProducts} {resultLabel}
              </Badge>
            </HStack>
            <Stack align={{ base: 'start', md: 'end' }} gap={0}>
              <Text color="#475569" fontSize={{ base: 'xs', md: 'sm' }}>
                {summaryText ?? `Mostrando ${filteredProducts} de ${totalProducts} productos`}
              </Text>
              <Separator width={{ base: '84px', md: '100px' }} borderColor="#cbd5e1" />
            </Stack>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}
