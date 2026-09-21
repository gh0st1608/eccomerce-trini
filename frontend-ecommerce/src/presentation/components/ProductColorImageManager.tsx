import { Box, Button, Flex, Image, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import type { AdminProductColorOption } from '@domain/entities/AdminProduct'
import { resolveProductColorHex } from '@shared/utils/productColor'

interface ProductColorImageManagerProps {
  colors: string[]
  colorOptions: AdminProductColorOption[]
  onChange: (colorOptions: AdminProductColorOption[]) => void
  onFilesSelect: (color: string, files: File[]) => Promise<void>
}

export function ProductColorImageManager({
  colors,
  colorOptions,
  onChange,
  onFilesSelect,
}: ProductColorImageManagerProps) {
  if (colors.length === 0) {
    return null
  }

  function updateOption(color: string, update: Partial<AdminProductColorOption>) {
    const existingOption = colorOptions.find((option) => option.name === color)
    onChange(existingOption
      ? colorOptions.map((option) => option.name === color ? { ...option, ...update } : option)
      : [...colorOptions, { name: color, hex: '#8b6f5c', images: [], ...update }])
  }

  return (
    <Box border="1px solid" borderColor="#dbe3ea" borderRadius="lg" bg="#f8fafc" p={4}>
      <Stack gap={4}>
        <Box>
          <Text fontWeight="semibold" color="#0f172a">Imagenes por color</Text>
          <Text mt={1} fontSize="sm" color="#64748b">
            Define el tono de la muestra y carga las vistas que vera el cliente al elegirlo.
          </Text>
        </Box>

        {colors.map((color) => {
          const option = colorOptions.find((entry) => entry.name === color) ?? {
            name: color,
            hex: resolveProductColorHex(color),
            images: [],
          }

          return (
          <Box key={option.name} border="1px solid" borderColor="#cbd5e1" borderRadius="md" bg="white" p={3}>
            <Flex align="center" justify="space-between" gap={3} mb={3} wrap="wrap">
              <Flex align="center" gap={3}>
                <Input
                  type="color"
                  aria-label={`Color visual de ${option.name}`}
                  value={option.hex}
                  width="44px"
                  height="44px"
                  minW="44px"
                  p="3px"
                  borderRadius="full"
                  cursor="pointer"
                  onChange={(event) => updateOption(option.name, { hex: event.target.value })}
                />
                <Box>
                  <Text fontWeight="semibold" color="#17222f">{option.name}</Text>
                  <Text fontSize="xs" color="#64748b">{option.images.length} imagen(es)</Text>
                </Box>
              </Flex>
              <Button asChild size="sm" variant="outline" borderColor="#0f766e" color="#0f766e">
                <label>
                  Agregar imagenes
                  <input
                    type="file"
                    aria-label={`Seleccionar imagenes para ${option.name}`}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(event) => {
                      void onFilesSelect(option.name, Array.from(event.target.files ?? []))
                      event.target.value = ''
                    }}
                  />
                </label>
              </Button>
            </Flex>

            {option.images.length > 0 ? (
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
                {option.images.map((imageUrl, imageIndex) => (
                  <Box key={`${option.name}-${imageIndex}`} border="1px solid" borderColor="#e2e8f0" borderRadius="md" overflow="hidden">
                    <Image src={imageUrl} alt={`${option.name}, imagen ${imageIndex + 1}`} aspectRatio="4 / 5" objectFit="cover" width="100%" />
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      color="#b91c1c"
                      width="100%"
                      borderRadius={0}
                      onClick={() => updateOption(option.name, {
                        images: option.images.filter((_, index) => index !== imageIndex),
                      })}
                    >
                      Eliminar
                    </Button>
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="#b45309">Carga al menos una imagen para este color.</Text>
            )}
          </Box>
          )
        })}
      </Stack>
    </Box>
  )
}