import { Box, HStack, Image, Text, VStack } from '@chakra-ui/react'

interface BrandLogoProps {
  size?: number
  showText?: boolean
}

export function BrandLogo({ size = 42, showText = true }: BrandLogoProps) {
  return (
    <HStack gap={{ base: 3, md: 4 }} align="center" justify="center">
      <Box
        width={{ base: `${Math.round(size * 1.05)}px`, md: `${Math.round(size * 1.18)}px` }}
        height={{ base: `${Math.round(size * 1.05)}px`, md: `${Math.round(size * 1.18)}px` }}
        borderRadius="lg"
        overflow="hidden"
        bg="#ead8f5"
        flexShrink={0}
      >
        <Image
          src="/logo-mayo-collection.svg"
          alt="Mayo Collection"
          width="100%"
          height="100%"
          objectFit="cover"
        />
      </Box>
      {showText ? (
        <VStack align="center" gap={0} lineHeight="0.82">
          <Text
            fontFamily="'Caveat', cursive"
            fontWeight="600"
            color="#171017"
            fontSize={{ base: '4xl', md: '5xl' }}
          >
            Mayo
          </Text>
          <Text
            color="#171017"
            fontSize={{ base: '8px', md: '10px' }}
            fontWeight="800"
            letterSpacing="0.22em"
            textTransform="uppercase"
          >
            Collection
          </Text>
        </VStack>
      ) : null}
    </HStack>
  )
}
