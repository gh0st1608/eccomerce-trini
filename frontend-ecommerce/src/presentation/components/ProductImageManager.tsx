import { Alert, Box, Button, Flex, Image, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ProductImageManagerProps {
  imageUrl: string
  images: string[]
  productName?: string
  onMainImageChange: (imageUrl: string) => void
  onGalleryChange: (images: string[]) => void
  onMainFileSelect: (file: File) => Promise<void>
  onGalleryFilesSelect: (files: File[]) => Promise<void>
}

function validateFiles(files: File[]): string | undefined {
  if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
    return 'Selecciona archivos JPG, PNG o WebP.'
  }

  if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
    return 'Cada imagen debe pesar como maximo 10 MB.'
  }
}

export function ProductImageManager({
  imageUrl,
  images,
  productName,
  onMainImageChange,
  onGalleryChange,
  onMainFileSelect,
  onGalleryFilesSelect,
}: ProductImageManagerProps) {
  const mainInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingMain, setIsDraggingMain] = useState(false)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false)
  const [isProcessingMain, setIsProcessingMain] = useState(false)
  const [isProcessingGallery, setIsProcessingGallery] = useState(false)
  const [galleryUrl, setGalleryUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function processMainFile(file: File | undefined) {
    if (!file) return

    const validationError = validateFiles([file])
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    try {
      setIsProcessingMain(true)
      setErrorMessage('')
      await onMainFileSelect(file)
    } catch {
      setErrorMessage('No se pudo procesar la portada. Prueba con otro archivo.')
    } finally {
      setIsProcessingMain(false)
    }
  }

  async function processGalleryFiles(files: File[]) {
    if (files.length === 0) return

    const validationError = validateFiles(files)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    try {
      setIsProcessingGallery(true)
      setErrorMessage('')
      await onGalleryFilesSelect(files)
    } catch {
      setErrorMessage('No se pudo procesar la galeria. Prueba con otros archivos.')
    } finally {
      setIsProcessingGallery(false)
    }
  }

  function addGalleryUrl() {
    const normalizedUrl = galleryUrl.trim()
    if (!normalizedUrl) return

    onGalleryChange([...images, normalizedUrl])
    setGalleryUrl('')
    setErrorMessage('')
  }

  return (
    <Stack gap={5}>
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
                alt={`Portada de ${productName?.trim() || 'producto'}`}
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
                <Text fontSize="sm" color="#64748b">Sin portada seleccionada</Text>
              </Stack>
            )}
          </Box>

          <Stack flex="1" minW={0} gap={4} justify="center">
            <Box>
              <Text fontWeight="semibold" color="#0f172a">Portada del producto</Text>
              <Text mt={1} fontSize="sm" color="#64748b">
                Imagen principal del catalogo. Se recorta al centro en formato 4:5 y se optimiza como WebP.
              </Text>
            </Box>

            <Box
              border="2px dashed"
              borderColor={isDraggingMain ? '#0f766e' : '#94a3b8'}
              borderRadius="md"
              bg={isDraggingMain ? '#ecfdf5' : 'white'}
              px={6}
              py={7}
              textAlign="center"
              transition="background-color 120ms ease, border-color 120ms ease"
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDraggingMain(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDraggingMain(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDraggingMain(false)
                void processMainFile(event.dataTransfer.files[0])
              }}
            >
              <Text fontWeight="semibold" color="#334155">Arrastra la portada aqui</Text>
              <Text mt={1} mb={3} fontSize="sm" color="#64748b">JPG, PNG o WebP, hasta 10 MB</Text>
              <Button
                type="button"
                size="sm"
                variant="outline"
                borderColor="#0f766e"
                color="#0f766e"
                loading={isProcessingMain}
                onClick={() => mainInputRef.current?.click()}
              >
                {imageUrl ? 'Reemplazar archivo' : 'Seleccionar archivo'}
              </Button>
              <input
                ref={mainInputRef}
                type="file"
                aria-label="Seleccionar portada del producto"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  void processMainFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </Box>

            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="#334155">O usa una URL publica</Text>
              <Input
                bg="white"
                placeholder="https://..."
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(event) => {
                  setErrorMessage('')
                  onMainImageChange(event.target.value.trim())
                }}
              />
            </Box>

            {imageUrl ? (
              <Button
                type="button"
                width="fit-content"
                size="sm"
                variant="outline"
                borderColor="#dc2626"
                color="#b91c1c"
                onClick={() => onMainImageChange('')}
              >
                Eliminar portada
              </Button>
            ) : null}
          </Stack>
        </Flex>
      </Box>

      <Box border="1px solid" borderColor="#dbe3ea" borderRadius="lg" bg="#f8fafc" p={4}>
        <Stack gap={4}>
          <Box>
            <Text fontWeight="semibold" color="#0f172a">Galeria del producto</Text>
            <Text mt={1} fontSize="sm" color="#64748b">
              Agrega varias vistas del producto. Todas conservaran el formato 4:5.
            </Text>
          </Box>

          <Box
            border="2px dashed"
            borderColor={isDraggingGallery ? '#0f766e' : '#94a3b8'}
            borderRadius="md"
            bg={isDraggingGallery ? '#ecfdf5' : 'white'}
            px={6}
            py={6}
            textAlign="center"
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDraggingGallery(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDraggingGallery(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDraggingGallery(false)
              void processGalleryFiles(Array.from(event.dataTransfer.files))
            }}
          >
            <Text fontWeight="semibold" color="#334155">Arrastra imagenes para la galeria</Text>
            <Text mt={1} mb={3} fontSize="sm" color="#64748b">Puedes seleccionar varios archivos</Text>
            <Button
              type="button"
              size="sm"
              variant="outline"
              borderColor="#0f766e"
              color="#0f766e"
              loading={isProcessingGallery}
              onClick={() => galleryInputRef.current?.click()}
            >
              Agregar archivos
            </Button>
            <input
              ref={galleryInputRef}
              type="file"
              aria-label="Seleccionar imagenes de galeria"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(event) => {
                void processGalleryFiles(Array.from(event.target.files ?? []))
                event.target.value = ''
              }}
            />
          </Box>

          <Flex gap={2} align="end" direction={{ base: 'column', md: 'row' }}>
            <Box flex="1" width="100%">
              <Text mb={1} fontSize="sm" fontWeight="medium" color="#334155">Agregar por URL publica</Text>
              <Input
                bg="white"
                placeholder="https://..."
                value={galleryUrl}
                onChange={(event) => setGalleryUrl(event.target.value)}
              />
            </Box>
            <Button type="button" variant="outline" onClick={addGalleryUrl}>Agregar URL</Button>
          </Flex>

          {images.length > 0 ? (
            <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} gap={3}>
              {images.map((imageRef, imageIndex) => (
                <Box
                  key={`${imageRef}-${imageIndex}`}
                  border="1px solid"
                  borderColor="#cbd5e1"
                  borderRadius="md"
                  overflow="hidden"
                  bg="white"
                >
                  <Image
                    src={imageRef}
                    alt={`Imagen ${imageIndex + 1} de ${productName?.trim() || 'producto'}`}
                    width="100%"
                    aspectRatio="4 / 5"
                    objectFit="cover"
                  />
                  <Flex px={2} py={2} align="center" justify="space-between" gap={2}>
                    <Text fontSize="xs" color="#64748b">Imagen {imageIndex + 1}</Text>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      color="#b91c1c"
                      onClick={() => onGalleryChange(images.filter((_, index) => index !== imageIndex))}
                    >
                      Eliminar
                    </Button>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Text fontSize="sm" color="#64748b">Aun no hay imagenes adicionales.</Text>
          )}

          {errorMessage ? (
            <Alert.Root status="error" borderRadius="md" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  )
}