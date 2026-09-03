import { Badge, Box, Button, Heading, HStack, Image, Stack, Text } from '@chakra-ui/react'
import type { Product } from '@domain/entities/Product'
import { formatCurrency } from '@shared/utils/currency'
import { Link } from 'react-router-dom'

interface ProductCardProps {
  product: Product
  quantityInCart?: number
  onAddToCart?: (product: Product) => void
  detailTo?: string
  compact?: boolean
}

export function ProductCard({
  product,
  quantityInCart = 0,
  onAddToCart,
  detailTo,
  compact = false,
}: ProductCardProps) {
  const detailLabel = `Ver detalle de ${product.name}`
  const discountPercent =
    product.discountPercent ??
    (product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : undefined)
  const hasDiscount = typeof discountPercent === 'number' && discountPercent > 0
  const referencePrice =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : hasDiscount && discountPercent < 100
        ? product.price / (1 - discountPercent / 100)
        : undefined

  if (compact) {
    return (
      <Box
        data-testid="product-card-compact"
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="blackAlpha.100"
        boxShadow="sm"
        overflow="hidden"
        transition="transform 180ms ease, box-shadow 180ms ease"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
      >
        <Box position="relative">
          {detailTo ? (
            <Link to={detailTo} aria-label={detailLabel} style={{ display: 'block', position: 'relative' }}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                objectFit="cover"
                width="100%"
                height="92px"
              />
              <Box
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="rgba(15, 23, 42, 0.35)"
                color="white"
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.02em"
                opacity={0}
                transition="opacity 180ms ease"
                _hover={{ opacity: 1 }}
              >
                Ver detalle
              </Box>
            </Link>
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.name}
              objectFit="cover"
              width="100%"
              height="92px"
            />
          )}
          <Badge
            position="absolute"
            left={1.5}
            top={1.5}
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg="#3f1d50"
            color="white"
            fontSize="2xs"
            textTransform="capitalize"
            maxW="80%"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {product.category}
          </Badge>
        </Box>

        <Stack gap={0.5} p={1.5}>
          <Heading size="xs" color="#17222f" lineClamp={1}>
            {product.name}
          </Heading>

          <HStack align="end" justify="space-between" gap={1}>
            <Stack gap={0}>
              <Text fontWeight="extrabold" fontSize="lg" color="#111827" lineHeight="1">
                {formatCurrency(product.price)}
              </Text>
              {hasDiscount && referencePrice ? (
                <HStack gap={1}>
                  <Text fontSize="2xs" color="#64748b" textDecoration="line-through" lineHeight="1">
                    {formatCurrency(referencePrice)}
                  </Text>
                  <Badge bg="#f97316" color="white" borderRadius="sm" px={1} py={0} fontSize="2xs">
                    -{discountPercent}%
                  </Badge>
                </HStack>
              ) : null}
            </Stack>
            {quantityInCart > 0 ? (
              <Badge colorPalette="purple" borderRadius="full" px={1.5} py={0.5} fontSize="2xs">
                x{quantityInCart}
              </Badge>
            ) : null}
          </HStack>

          <HStack gap={1.5}>
            {onAddToCart ? (
              <Button
                size="2xs"
                flex="1"
                bg="#7b4e98"
                color="white"
                _hover={{ bg: '#5c3275' }}
                touchAction="manipulation"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onAddToCart(product)}
              >
                Agregar
              </Button>
            ) : null}

            {detailTo ? (
              <Button
                asChild
                size="2xs"
                flex="1"
                variant="outline"
                borderColor="blackAlpha.300"
                touchAction="manipulation"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Link to={detailTo}>Ver detalle</Link>
              </Button>
            ) : null}
          </HStack>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      data-testid="product-card-default"
      bg="rgba(255, 255, 255, 0.92)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="blackAlpha.200"
      boxShadow="lg"
      overflow="hidden"
      transition="transform 200ms ease, box-shadow 200ms ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
    >
      <Box position="relative">
        {detailTo ? (
          <Link to={detailTo} aria-label={detailLabel} style={{ display: 'block', position: 'relative' }}>
            <Image
              src={product.imageUrl}
              alt={product.name}
              objectFit="cover"
              width="100%"
              height={{ base: compact ? '132px' : '190px', md: '260px' }}
            />
            <Box
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="rgba(15, 23, 42, 0.32)"
              color="white"
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="semibold"
              letterSpacing="0.02em"
              opacity={0}
              transition="opacity 180ms ease"
              _hover={{ opacity: 1 }}
            >
              Ver detalle
            </Box>
          </Link>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            objectFit="cover"
            width="100%"
            height={{ base: compact ? '132px' : '190px', md: '260px' }}
          />
        )}
        <Badge
          position="absolute"
          left={{ base: compact ? 2 : 3, md: 3 }}
          top={{ base: compact ? 2 : 3, md: 3 }}
          px={{ base: compact ? 2 : 3, md: 3 }}
          py={{ base: compact ? 0.5 : 1, md: 1 }}
          fontSize={{ base: compact ? '2xs' : 'xs', md: 'xs' }}
          borderRadius="full"
          bg="#3f1d50"
          color="white"
        >
          {product.category}
        </Badge>
      </Box>
      <Box p={{ base: compact ? 3 : 4, md: 6 }}>
        <Stack gap={{ base: compact ? 1.5 : 2.5, md: 3 }}>
          <Heading size={{ base: compact ? 'xs' : 'sm', md: 'md' }} color="#17222f" lineClamp={2}>
            {product.name}
          </Heading>
          <Text
            color="#425466"
            fontSize={{ base: compact ? 'xs' : 'sm', md: 'md' }}
            lineClamp={compact ? 1 : 2}
            display={compact ? { base: 'none', sm: 'block' } : undefined}
          >
            {product.description}
          </Text>
          <HStack justify="space-between" align="center">
            <Stack gap={0.5}>
              <Text fontWeight="bold" fontSize={{ base: compact ? 'md' : 'lg', md: 'xl' }} color="#6b3d84">
                {formatCurrency(product.price)}
              </Text>
              {hasDiscount && referencePrice ? (
                <HStack gap={2}>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="#64748b" textDecoration="line-through">
                    {formatCurrency(referencePrice)}
                  </Text>
                  <Badge bg="#f97316" color="white" borderRadius="sm" px={2} py={0.5}>
                    -{discountPercent}%
                  </Badge>
                </HStack>
              ) : null}
            </Stack>
            {quantityInCart > 0 ? (
              <Badge
                colorPalette="purple"
                borderRadius="full"
                px={{ base: compact ? 2 : 2.5, md: 2.5 }}
                py={{ base: compact ? 0.5 : 1, md: 1 }}
                fontSize={{ base: compact ? '2xs' : 'xs', md: 'xs' }}
              >
                En carrito: {quantityInCart}
              </Badge>
            ) : null}
          </HStack>
          <HStack gap={2}>
            {onAddToCart ? (
              <Button
                size={{ base: compact ? 'xs' : 'sm', md: 'md' }}
                flex="1"
                bg="#7b4e98"
                color="white"
                _hover={{ bg: '#5c3275' }}
                touchAction="manipulation"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onAddToCart(product)}
              >
                Agregar
              </Button>
            ) : null}
            {detailTo ? (
              <Button
                asChild
                size={{ base: compact ? 'xs' : 'sm', md: 'md' }}
                flex="1"
                variant="outline"
                borderColor="blackAlpha.300"
                touchAction="manipulation"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Link to={detailTo}>{compact ? 'Detalle' : 'Ver detalle'}</Link>
              </Button>
            ) : null}
          </HStack>
        </Stack>
      </Box>
    </Box>
  )
}
