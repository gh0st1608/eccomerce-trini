import { Box, HStack, Image, Text } from '@chakra-ui/react'

interface BrandLogoProps {
  size?: number
  showText?: boolean
}

export function BrandLogo({ size = 42, showText = true }: BrandLogoProps) {
  return (
    <HStack gap={3} align="center">
      <Box
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="full"
        overflow="hidden"
        border="1px solid"
        borderColor="blackAlpha.200"
        bg="white"
        flexShrink={0}
      >
        <Image src="/logo-mayo-collection.svg" alt="Mayo Collection" width="100%" height="100%" objectFit="cover" />
      </Box>
      {showText ? (
        <Text fontWeight="extrabold" color="#3f1d50" fontSize={{ base: 'xl', md: '2xl' }} letterSpacing="0.03em">
          Mayo Collection
        </Text>
      ) : null}
    </HStack>
  )
}
