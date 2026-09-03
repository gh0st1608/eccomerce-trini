import { Badge, Box, Button, Heading, HStack, Image, Stack, Text } from '@chakra-ui/react'
import type { Product } from '@domain/entities/Product'
import { formatCurrency } from '@shared/utils/currency'

interface ProductDetailPanelProps {
  product: Product | null
  quantityInCart: number
  onAddToCart: (product: Product) => void
}

export function ProductDetailPanel({
  product,
  quantityInCart,
  onAddToCart,
}: ProductDetailPanelProps) {
  if (!product) {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.85)"
        border="1px solid"
        borderColor="blackAlpha.200"
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        boxShadow="lg"
        minH={{ base: 'auto', xl: '440px' }}
        display="flex"
        alignItems="center"
      >
        <Stack gap={3}>
          <Heading size="md" color="#0f172a">
            Selecciona un producto
          </Heading>
          <Text color="#475569">
            Haz clic en Ver detalle para mostrar informacion ampliada, beneficios y acciones de
            compra.
          </Text>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      bg="rgba(255, 255, 255, 0.95)"
      border="1px solid"
      borderColor="blackAlpha.200"
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      boxShadow="xl"
      minH={{ base: 'auto', xl: '440px' }}
      position={{ base: 'static', xl: 'sticky' }}
      top={{ xl: 24 }}
    >
      <Stack gap={4}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          borderRadius="xl"
          objectFit="cover"
          height={{ base: '170px', md: '260px' }}
          width="100%"
        />

        <HStack justify="space-between" align="start">
          <Stack gap={1}>
            <Badge width="fit-content" colorPalette="cyan" px={2.5} py={1} borderRadius="full">
              {product.category}
            </Badge>
            <Heading size={{ base: 'md', md: 'lg' }} color="#0f172a">
              {product.name}
            </Heading>
          </Stack>
          <Text fontWeight="bold" fontSize={{ base: 'xl', md: '2xl' }} color="#0f766e">
            {formatCurrency(product.price)}
          </Text>
        </HStack>

        <Text color="#475569">{product.description}</Text>

        <HStack justify="space-between" color="#64748b" fontSize="sm">
          <Text>SKU: {product.id}</Text>
          <Text>{quantityInCart} en carrito</Text>
        </HStack>

        <Button
          size={{ base: 'sm', md: 'md' }}
          bg="#0f766e"
          color="white"
          _hover={{ bg: '#115e59' }}
          onClick={() => onAddToCart(product)}
        >
          Agregar al carrito
        </Button>
      </Stack>
    </Box>
  )
}
