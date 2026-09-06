const PRODUCT_IMAGE_ASPECT_RATIO = 4 / 5
const PRODUCT_IMAGE_MAX_WIDTH = 1000
const PRODUCT_IMAGE_MAX_HEIGHT = 1250
const PRODUCT_IMAGE_QUALITY = 0.86

export interface ImageCrop {
  x: number
  y: number
  width: number
  height: number
}

export function calculateCenteredProductCrop(sourceWidth: number, sourceHeight: number): ImageCrop {
  const sourceAspectRatio = sourceWidth / sourceHeight

  if (sourceAspectRatio > PRODUCT_IMAGE_ASPECT_RATIO) {
    const width = sourceHeight * PRODUCT_IMAGE_ASPECT_RATIO
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight }
  }

  const height = sourceWidth / PRODUCT_IMAGE_ASPECT_RATIO
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height }
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada.'))
    image.src = objectUrl
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo normalizar la imagen seleccionada.'))
          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
            return
          }

          reject(new Error('No se pudo leer la imagen normalizada.'))
        }
        reader.onerror = () => reject(new Error('No se pudo leer la imagen normalizada.'))
        reader.readAsDataURL(blob)
      },
      'image/webp',
      PRODUCT_IMAGE_QUALITY,
    )
  })
}

export async function normalizeProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen valida.')
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const crop = calculateCenteredProductCrop(image.naturalWidth, image.naturalHeight)
    const scale = Math.min(
      1,
      PRODUCT_IMAGE_MAX_WIDTH / crop.width,
      PRODUCT_IMAGE_MAX_HEIGHT / crop.height,
    )
    const outputWidth = Math.max(1, Math.round(crop.width * scale))
    const outputHeight = Math.max(1, Math.round(crop.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('El navegador no permite procesar la imagen seleccionada.')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputWidth, outputHeight)
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      outputWidth,
      outputHeight,
    )

    return await canvasToDataUrl(canvas)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function normalizeProductImages(files: FileList | File[]): Promise<string[]> {
  return await Promise.all(Array.from(files).map((file) => normalizeProductImage(file)))
}