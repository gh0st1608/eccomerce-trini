import { Box, Button, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import type { StorefrontSettings } from '@domain/entities/StorefrontSettings'

interface CatalogPromoBannerProps {
	banner: StorefrontSettings['promoBanner']
	cartCount: number
	onShowOffers: () => void
	onOpenCart: () => void
}

export function CatalogPromoBanner({ banner, cartCount, onShowOffers, onOpenCart }: CatalogPromoBannerProps) {
	if (!banner.enabled) return null

	return (
		<Box position="relative" overflow="hidden" borderRadius={{ base: '2xl', md: '3xl' }} px={{ base: 5, md: 10 }} py={{ base: 6, md: 9 }} bg="#48215d" bgImage={banner.imageUrl ? `linear-gradient(90deg, rgba(43,18,61,.92), rgba(43,18,61,.45)), url(${banner.imageUrl})` : 'linear-gradient(118deg, #2b123d 0%, #673b7d 50%, #b697d3 100%)'} bgSize="cover" backgroundPosition="center" boxShadow="0 24px 50px rgba(74, 29, 99, 0.26)">
			<Flex position="relative" justify="space-between" align="center">
				<Stack gap={4} maxW="2xl">
					<Text color="#f4e8ff" fontWeight="bold" letterSpacing="0.16em" fontSize="sm">{banner.eyebrow}</Text>
					<Heading color="white" fontFamily="'Space Grotesk', sans-serif" fontSize={{ base: '2xl', md: '5xl' }} lineHeight="1">{banner.title}</Heading>
					<Text color="#f4e8ff" fontSize={{ base: 'sm', md: 'lg' }}>{banner.content}</Text>
					<HStack gap={3} wrap="wrap">
						<Button bg="#f4e8ff" color="#4a1d63" onClick={onShowOffers}>{banner.ctaLabel}</Button>
						<Button variant="outline" borderColor="whiteAlpha.500" color="white" onClick={onOpenCart}>Carrito ({cartCount})</Button>
					</HStack>
				</Stack>
			</Flex>
		</Box>
	)
}
