import { Alert, Box, Button, Flex, Image, Input, Stack, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

interface CategoryImageManagerProps {
  imageUrl?: string
  categoryName?: string
  isRequired: boolean
  onChange: (imageUrl: string | undefined) => void
  onFileSelect: (file: File) => Promise<void>
}

export function CategoryImageManager({
  imageUrl,
  categoryName,
  isRequired,
  onChange,
  onFileSelect,
}: CategoryImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function processFile(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Selecciona un archivo de imagen valido.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage('La imagen no debe superar los 10 MB.')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage('')
      await onFileSelect(file)
    } catch {
      setErrorMessage('No se pudo procesar la imagen. Prueba con otro archivo.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Box border="1px solid" borderColor="#dbe3ea" borderRadius="lg" bg="#f8fafc" p={4}>
      <Flex gap={5} align="stretch" direction={{ base: 'column', lg: 'row' }}>
        <Box
          width={{ base: '100%', lg: '240px' }}
          flexShrink={0}
          aspectRatio="4 / 5"
          overflow="hidden"
          borderRadius="md"
          border="1px solid"
          borderColor={imageUrl ? '#cbd5e1' : '#dbe3ea'}
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Portada de ${categoryName?.trim() || 'la categoria'}`}
              width="100%"
              height="100%"
              objectFit="cover"
            />
          ) : (
            <Stack align="center" gap={2} px={5} textAlign="center">
              <Box
                width="52px"
                height="64px"
                border="2px solid"
                borderColor="#94a3b8"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="#64748b"
                fontWeight="bold"
              >
                4:5
              </Box>
              <Text fontSize="sm" color="#64748b">
                Sin portada seleccionada
              </Text>
            </Stack>
          )}
        </Box>

        <Stack flex="1" minW={0} gap={4} justify="center">
          <Box>
            <Text fontWeight="semibold" color="#0f172a">
              Portada de categoria
            </Text>
            <Text mt={1} fontSize="sm" color="#64748b">
              {isRequired
                ? 'Obligatoria para categorias especificas.'
                : 'Opcional para categorias generales.'}
              {' '}Se recorta al centro en formato 4:5 y se optimiza como WebP.
            </Text>
          </Box>

          <Box
            border="2px dashed"
            borderColor={isDragging ? '#0f766e' : '#94a3b8'}
            borderRadius="md"
            bg={isDragging ? '#ecfdf5' : 'white'}
            px={6}
            py={7}
            textAlign="center"
            transition="background-color 120ms ease, border-color 120ms ease"
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              void processFile(event.dataTransfer.files[0])
            }}
          >
            <Text fontWeight="semibold" color="#334155">
              Arrastra una imagen aqui
            </Text>
            <Text mt={1} mb={3} fontSize="sm" color="#64748b">
              JPG, PNG o WebP, hasta 10 MB
            </Text>
            <Button
              type="button"
              size="sm"
              variant="outline"
              borderColor="#0f766e"
              color="#0f766e"
              loading={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUrl ? 'Reemplazar archivo' : 'Seleccionar archivo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Seleccionar imagen de categoria"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                void processFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="#334155">
              O usa una URL publica
            </Text>
            <Input
              bg="white"
              placeholder="https://..."
              value={imageUrl?.startsWith('data:') ? '' : imageUrl ?? ''}
              onChange={(event) => {
                setErrorMessage('')
                onChange(event.target.value.trim() || undefined)
              }}
            />
          </Box>

          {errorMessage ? (
            <Alert.Root status="error" borderRadius="md" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {imageUrl ? (
            <Button
              type="button"
              width="fit-content"
              size="sm"
              variant="outline"
              borderColor="#dc2626"
              color="#b91c1c"
              onClick={() => {
                setErrorMessage('')
                onChange(undefined)
              }}
            >
              Eliminar imagen
            </Button>
          ) : null}
        </Stack>
      </Flex>
    </Box>
  )
}
