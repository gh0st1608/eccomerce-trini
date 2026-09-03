import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CartIcon, CategoriesIcon, HomeIcon, UserIcon } from '@presentation/components/UiIcons'

interface MobileBottomNavProps {
  cartCount: number
}

export function MobileBottomNav({ cartCount }: MobileBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <Box
      display={{ base: 'block', md: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="#fffaff"
      borderTop="1px solid"
      borderColor="#e3d3eb"
      zIndex={30}
      px={2}
      py={1.5}
      boxShadow="0 -8px 24px rgba(74, 29, 99, 0.12)"
    >
      <HStack justify="space-around" align="center">
        <Button
          size="sm"
          variant="ghost"
          color={isActive('/') ? '#4a1d63' : '#65477a'}
          onClick={() => navigate('/')}
        >
          <Stack align="center" gap={0.5}>
            <HomeIcon size={17} />
            <Text fontSize="xs" fontWeight="bold">
              Home
            </Text>
          </Stack>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          color={isActive('/categories') ? '#4a1d63' : '#65477a'}
          onClick={() => navigate('/categories')}
        >
          <Stack align="center" gap={0.5}>
            <CategoriesIcon size={17} />
            <Text fontSize="xs" fontWeight="bold">
              Categorias
            </Text>
          </Stack>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          color="#4a1d63"
          onClick={() => navigate('/cart')}
        >
          <Stack align="center" gap={0.5}>
            <CartIcon size={17} />
            <Text fontSize="xs" fontWeight="bold">
              Carrito
            </Text>
            <Text fontSize="10px" color="#7b4e98">
              {cartCount} items
            </Text>
          </Stack>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          color="#94a3b8"
          disabled
        >
          <Stack align="center" gap={0.5}>
            <UserIcon size={17} />
            <Text fontSize="xs" fontWeight="bold">
              Profile
            </Text>
          </Stack>
        </Button>
      </HStack>
    </Box>
  )
}
