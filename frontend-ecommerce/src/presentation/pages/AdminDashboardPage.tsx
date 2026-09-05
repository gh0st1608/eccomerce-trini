import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Separator,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import type { AdminProduct, AdminProductOptions, CreateAdminProductInput } from '@domain/entities/AdminProduct'
import type { AdminCategory, CreateAdminCategoryInput } from '@domain/entities/AdminCategory'
import type { AdminStore, CreateAdminStoreInput } from '@domain/entities/AdminStore'
import type { AdminOrder } from '@domain/entities/AdminOrder'
import { createAdminProductRepository } from '@infrastructure/factories/createAdminProductRepository'
import { createAdminCategoryRepository } from '@infrastructure/factories/createAdminCategoryRepository'
import { createAdminOrderRepository } from '@infrastructure/factories/createAdminOrderRepository'
import { createAdminStoreRepository } from '@infrastructure/factories/createAdminStoreRepository'
import { ListAdminProductsUseCase } from '@application/use-cases/ListAdminProductsUseCase'
import { CreateAdminProductUseCase } from '@application/use-cases/CreateAdminProductUseCase'
import { UpdateAdminProductUseCase } from '@application/use-cases/UpdateAdminProductUseCase'
import { GetAdminProductOptionsUseCase } from '@application/use-cases/GetAdminProductOptionsUseCase'
import { ListAdminCategoriesUseCase } from '@application/use-cases/ListAdminCategoriesUseCase'
import { CreateAdminCategoryUseCase } from '@application/use-cases/CreateAdminCategoryUseCase'
import { UpdateAdminCategoryUseCase } from '@application/use-cases/UpdateAdminCategoryUseCase'
import { ListAdminOrdersUseCase } from '@application/use-cases/ListAdminOrdersUseCase'
import { ListAdminStoresUseCase } from '@application/use-cases/ListAdminStoresUseCase'
import { CreateAdminStoreUseCase } from '@application/use-cases/CreateAdminStoreUseCase'
import { UpdateAdminStoreUseCase } from '@application/use-cases/UpdateAdminStoreUseCase'
import { clearAdminAuthToken } from '@shared/utils/adminAuth'
import {
  setLocalCheckoutOrderPaymentStatus,
  setLocalCheckoutOrderStatus,
  setOrderPaymentStatusOverride,
  setOrderStatusOverride,
} from '@shared/utils/adminOrderHistory'
import { BrandLogo } from '@presentation/components/BrandLogo'
import { formatCurrency } from '@shared/utils/currency'
import {
  updateOfferFromDiscount,
  updateOfferFromOriginalPrice,
  updateOfferFromPrice,
} from '@shared/utils/offerPricing'

type AdminSection = 'products' | 'categories' | 'stores' | 'orders'
type ModalTone = 'success' | 'error' | 'info'
type ProductEditorMode = 'create' | 'update'
type CategoryEditorMode = 'create' | 'update'
type StoreEditorMode = 'create' | 'update'
type ProductStatusFilter = 'active' | 'inactive' | 'all'
type OrderStatusFilter = 'active' | 'inactive' | 'all'
type EntityStatusFilter = 'active' | 'inactive' | 'all'

const defaultProductForm: CreateAdminProductInput = {
  name: '',
  sku: '',
  variantGroup: undefined,
  description: '',
  category: '',
  categories: [],
  imageUrl: 'https://picsum.photos/seed/admin-default/900/1200',
  images: [],
  colors: [],
  sizes: [],
  productType: 'simple',
  attributes: [],
  variants: [],
  inventory: { quantity: 0, inStock: false },
  prices: [],
  storeAvailability: [],
  price: 0,
  originalPrice: undefined,
  discountPercent: undefined,
  currency: 'PEN',
  stock: 0,
  featured: false,
  status: 'active',
}

const defaultCategoryForm: CreateAdminCategoryInput = {
  name: '',
  slug: '',
  description: '',
  active: true,
}

const defaultStoreForm: CreateAdminStoreInput = {
  name: '',
  slug: '',
  address: '',
  district: '',
  reference: '',
  pickupEnabled: true,
  courierEnabled: true,
  active: true,
}

interface FeedbackState {
  isOpen: boolean
  tone: ModalTone
  title: string
  message: string
}

interface ProductEditorState {
  isOpen: boolean
  mode: ProductEditorMode
  productId: string | null
}

interface CategoryEditorState {
  isOpen: boolean
  mode: CategoryEditorMode
  categoryId: string | null
}

interface StoreEditorState {
  isOpen: boolean
  mode: StoreEditorMode
  storeId: string | null
}

interface ConfirmDeleteState {
  isOpen: boolean
  entity: 'product' | 'category' | 'store' | 'order'
  id: string
}

function ModalShell({
  isOpen,
  title,
  onClose,
  children,
}: PropsWithChildren<{ isOpen: boolean; title: string; onClose: () => void }>) {
  if (!isOpen) {
    return null
  }

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(15, 23, 42, 0.45)"
      backdropFilter="blur(2px)"
      zIndex={80}
      display="flex"
      alignItems={{ base: 'flex-start', md: 'center' }}
      justifyContent="center"
      p={{ base: 2, md: 4 }}
      overflowY="auto"
    >
      <Box
        bg="white"
        borderRadius="2xl"
        border="1px solid"
        borderColor="blackAlpha.200"
        boxShadow="2xl"
        width="100%"
        maxW={{ base: '100%', md: '680px' }}
        maxH="calc(100dvh - 1rem)"
        p={{ base: 4, md: 5 }}
        display="flex"
        flexDirection="column"
        my={{ base: 2, md: 0 }}
      >
        <HStack justify="space-between" align="center" mb={4} flexShrink={0}>
          <Heading size="md" color="#0f172a">
            {title}
          </Heading>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </HStack>
        <Box overflowY="auto" pr={1} pb={1}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

function FormField({
  label,
  helper,
  error,
  children,
}: PropsWithChildren<{ label: string; helper?: string; error?: string }>) {
  return (
    <VStack align="stretch" gap={1}>
      <Text fontSize="sm" fontWeight="semibold" color="#334155">
        {label}
      </Text>
      {children}
      {error ? (
        <Text fontSize="xs" color="#b91c1c">
          {error}
        </Text>
      ) : null}
      {helper ? (
        <Text fontSize="xs" color="#64748b">
          {helper}
        </Text>
      ) : null}
    </VStack>
  )
}

function parseCommaSeparatedValue(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function parseMultiSelectValues(element: HTMLSelectElement): string[] {
  return Array.from(element.selectedOptions).map((option) => option.value)
}

function parseNumberOrDefault(value: string, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function countIndexedErrors(sectionErrors?: Record<number, string>): number {
  return Object.keys(sectionErrors ?? {}).length
}

function parseVariantAttributes(value: string): Array<{ name: string; value: string }> {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [name = '', attrValue = ''] = entry.split(/[:=]/).map((part) => part.trim())
      return { name, value: attrValue }
    })
    .filter((entry) => entry.name.length > 0 && entry.value.length > 0)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }

      reject(new Error('No se pudo leer el archivo seleccionado.'))
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'))
    reader.readAsDataURL(file)
  })
}

async function filesToDataUrls(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files)
  return Promise.all(fileArray.map((file) => fileToDataUrl(file)))
}

function isHttpImageReference(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/')
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeCategoryPayload(payload: CreateAdminCategoryInput): CreateAdminCategoryInput {
  const normalizedName = payload.name.trim()
  const normalizedSlugSource = payload.slug.trim().length > 0 ? payload.slug : normalizedName

  return {
    ...payload,
    name: normalizedName,
    slug: normalizeSlug(normalizedSlugSource),
    description: payload.description.trim(),
  }
}

function validateCategoryPayload(payload: CreateAdminCategoryInput): { isValid: boolean; message?: string } {
  if (payload.name.length < 2) {
    return { isValid: false, message: 'El nombre de la categoria debe tener al menos 2 caracteres.' }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    return {
      isValid: false,
      message: 'El slug solo puede contener minusculas, numeros y guiones (ej. joyas-finas).',
    }
  }

  return { isValid: true }
}

function stringifyVariantAttributes(attributes: Array<{ name: string; value: string }> = []): string {
  return attributes.map((attribute) => `${attribute.name}:${attribute.value}`).join(', ')
}

function normalizeProductPayload(payload: CreateAdminProductInput): CreateAdminProductInput {
  const normalizedCategories = (payload.categories ?? []).filter((entry) => entry.trim().length > 0)
  const normalizedAttributes = (payload.attributes ?? [])
    .map((attribute) => ({
      name: attribute.name.trim(),
      values: attribute.values.map((value) => value.trim()).filter((value) => value.length > 0),
    }))
    .filter((attribute) => attribute.name.length > 0 && attribute.values.length > 0)

  const normalizedPrices = (payload.prices ?? [])
    .map((priceEntry) => ({
      currency: priceEntry.currency.trim().toUpperCase(),
      amount: Number(priceEntry.amount),
      originalAmount:
        priceEntry.originalAmount === undefined ? undefined : Number(priceEntry.originalAmount),
      discountPercent:
        priceEntry.discountPercent === undefined ? undefined : Number(priceEntry.discountPercent),
    }))
    .filter((priceEntry) => Number.isFinite(priceEntry.amount) && priceEntry.amount > 0)

  const normalizedInventory = {
    quantity: Number(payload.inventory?.quantity ?? payload.stock ?? 0),
    inStock: payload.inventory?.inStock ?? Number(payload.inventory?.quantity ?? payload.stock ?? 0) > 0,
  }

  const normalizedVariants = (payload.variants ?? [])
    .map((variant) => {
      const firstPrice = variant.prices?.[0]
      const normalizedVariantPrices = (variant.prices ?? [])
        .map((priceEntry) => ({
          currency: priceEntry.currency.trim().toUpperCase(),
          amount: Number(priceEntry.amount),
          originalAmount:
            priceEntry.originalAmount === undefined ? undefined : Number(priceEntry.originalAmount),
          discountPercent:
            priceEntry.discountPercent === undefined ? undefined : Number(priceEntry.discountPercent),
        }))
        .filter((priceEntry) => Number.isFinite(priceEntry.amount) && priceEntry.amount > 0)

      return {
        ...variant,
        id: variant.id?.trim() || undefined,
        sku: variant.sku?.trim() || undefined,
        name: variant.name?.trim() || undefined,
        imageUrl: variant.imageUrl?.trim() || undefined,
        attributes: (variant.attributes ?? [])
          .map((attribute) => ({
            name: attribute.name.trim(),
            value: attribute.value.trim(),
          }))
          .filter((attribute) => attribute.name.length > 0 && attribute.value.length > 0),
        inventory: {
          quantity: Number(variant.inventory?.quantity ?? 0),
          inStock: variant.inventory?.inStock ?? Number(variant.inventory?.quantity ?? 0) > 0,
        },
        prices: normalizedVariantPrices.length > 0
          ? normalizedVariantPrices
          : firstPrice
            ? [{ ...firstPrice, currency: firstPrice.currency.toUpperCase() }]
            : [],
      }
    })
    .filter((variant) => variant.sku || variant.name)

  const normalizedStoreAvailability = (payload.storeAvailability ?? [])
    .map((storeEntry) => ({
      storeId: storeEntry.storeId.trim(),
      available: storeEntry.available,
      quantity: storeEntry.quantity === undefined ? undefined : Number(storeEntry.quantity),
    }))
    .filter((storeEntry) => storeEntry.storeId.length > 0)

  const firstPrice = normalizedPrices[0]

  return {
    ...payload,
    categories: normalizedCategories,
    category: payload.category || normalizedCategories[0] || payload.category,
    attributes: normalizedAttributes,
    prices: normalizedPrices,
    inventory: normalizedInventory,
    variants: normalizedVariants,
    storeAvailability: normalizedStoreAvailability,
    price: typeof payload.price === 'number' && Number.isFinite(payload.price)
      ? payload.price
      : firstPrice?.amount ?? 0,
    originalPrice:
      payload.originalPrice === undefined
        ? firstPrice?.originalAmount
        : payload.originalPrice,
    discountPercent:
      payload.discountPercent === undefined
        ? firstPrice?.discountPercent
        : payload.discountPercent,
    currency: (payload.currency || firstPrice?.currency || 'PEN').toUpperCase(),
    stock: Number(payload.stock ?? normalizedInventory.quantity),
  }
}

type ProductFormErrorMap = {
  summary?: string
  name?: string
  sku?: string
  category?: string
  price?: string
  originalPrice?: string
  discountPercent?: string
  currency?: string
  stock?: string
  attributes?: string
  prices?: string
  variants?: string
  storeAvailability?: string
  attributesByIndex?: Record<number, string>
  pricesByIndex?: Record<number, string>
  variantsByIndex?: Record<number, string>
  storeAvailabilityByIndex?: Record<number, string>
}

type ProductValidationResult = {
  isValid: boolean
  errors: ProductFormErrorMap
}

function validateProductPayload(
  payload: CreateAdminProductInput,
  isProductOnOffer = false,
): ProductValidationResult {
  const errors: ProductFormErrorMap = {}
  const setIndexedError = (
    section: 'attributesByIndex' | 'pricesByIndex' | 'variantsByIndex' | 'storeAvailabilityByIndex',
    index: number,
    message: string,
  ) => {
    errors[section] = errors[section] ?? {}
    if (!errors[section]?.[index]) {
      errors[section]![index] = message
    }
  }

  if (payload.name.trim().length < 3) {
    errors.name = 'El nombre del producto debe tener al menos 3 caracteres.'
  }

  if (payload.sku.trim().length < 3) {
    errors.sku = 'El SKU del producto debe tener al menos 3 caracteres.'
  }

  if (payload.category.trim().length < 2) {
    errors.category = 'Selecciona una categoria principal valida.'
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    errors.price = 'El precio principal debe ser mayor a 0.'
  }

  if (!Number.isFinite(payload.stock) || payload.stock < 0) {
    errors.stock = 'El stock principal no puede ser negativo.'
  }

  if (payload.currency.trim().length !== 3) {
    errors.currency = 'La moneda principal debe tener 3 caracteres (ej. PEN).'
  }

  if (payload.originalPrice !== undefined && payload.originalPrice < payload.price) {
    errors.originalPrice = 'El precio original no puede ser menor al precio actual.'
  }

  if (isProductOnOffer && (!payload.originalPrice || payload.originalPrice <= payload.price)) {
    errors.originalPrice = 'Ingresa un precio original mayor al precio actual.'
  }

  if (
    payload.discountPercent !== undefined
    && (payload.discountPercent < 0 || payload.discountPercent > 90)
  ) {
    errors.discountPercent = 'El descuento principal debe estar entre 0 y 90.'
  }

  if (isProductOnOffer && (!payload.discountPercent || payload.discountPercent <= 0)) {
    errors.discountPercent = 'Ingresa un descuento entre 1 y 90.'
  }

  const seenStoreIds = new Set<string>()
  for (const [storeIndex, storeEntry] of (payload.storeAvailability ?? []).entries()) {
    if (!storeEntry.storeId || storeEntry.storeId.trim().length === 0) {
      errors.storeAvailability = 'Cada disponibilidad por tienda debe tener una tienda seleccionada.'
      setIndexedError('storeAvailabilityByIndex', storeIndex, 'Selecciona una tienda.')
      break
    }

    if (seenStoreIds.has(storeEntry.storeId)) {
      errors.storeAvailability = 'No puedes repetir una misma tienda en disponibilidad por tienda.'
      setIndexedError('storeAvailabilityByIndex', storeIndex, 'Tienda repetida en disponibilidad.')
      break
    }

    seenStoreIds.add(storeEntry.storeId)

    if (storeEntry.quantity !== undefined && storeEntry.quantity < 0) {
      errors.storeAvailability = 'La cantidad por tienda no puede ser negativa.'
      setIndexedError('storeAvailabilityByIndex', storeIndex, 'La cantidad no puede ser negativa.')
      break
    }
  }

  for (const [index, priceEntry] of (payload.prices ?? []).entries()) {
    if (priceEntry.currency.trim().length !== 3) {
      errors.prices = `La moneda del precio ${index + 1} debe tener 3 caracteres.`
      setIndexedError('pricesByIndex', index, 'La moneda debe tener 3 caracteres.')
      break
    }

    if (!Number.isFinite(priceEntry.amount) || priceEntry.amount <= 0) {
      errors.prices = `El monto del precio ${index + 1} debe ser mayor a 0.`
      setIndexedError('pricesByIndex', index, 'El monto debe ser mayor a 0.')
      break
    }

    if (
      priceEntry.originalAmount !== undefined
      && priceEntry.originalAmount < priceEntry.amount
    ) {
      errors.prices = `El precio original del precio ${index + 1} no puede ser menor al monto actual.`
      setIndexedError('pricesByIndex', index, 'El precio original no puede ser menor al monto.')
      break
    }
  }

  const seenVariantSkus = new Set<string>()
  for (const [index, variant] of (payload.variants ?? []).entries()) {
    const hasSku = Boolean(variant.sku && variant.sku.trim().length > 0)
    const hasName = Boolean(variant.name && variant.name.trim().length > 0)

    if (!hasSku && !hasName) {
      errors.variants = `La variante ${index + 1} debe tener SKU o nombre.`
      setIndexedError('variantsByIndex', index, 'Completa SKU o nombre de la variante.')
      break
    }

    const normalizedVariantSku = variant.sku?.trim().toUpperCase()
    if (normalizedVariantSku) {
      if (seenVariantSkus.has(normalizedVariantSku)) {
        errors.variants = `El SKU ${normalizedVariantSku} esta repetido entre variantes.`
        setIndexedError('variantsByIndex', index, `SKU repetido: ${normalizedVariantSku}.`)
        break
      }
      seenVariantSkus.add(normalizedVariantSku)
    }

    if ((variant.inventory?.quantity ?? 0) < 0) {
      errors.variants = `El stock de la variante ${index + 1} no puede ser negativo.`
      setIndexedError('variantsByIndex', index, 'El stock no puede ser negativo.')
      break
    }

    const variantPrices = variant.prices ?? []
    if (variantPrices.length === 0) {
      errors.variants = `La variante ${index + 1} debe tener al menos un precio.`
      setIndexedError('variantsByIndex', index, 'Agrega al menos un precio para la variante.')
      break
    }

    for (const [priceIndex, priceEntry] of variantPrices.entries()) {
      if (priceEntry.currency.trim().length !== 3) {
        errors.variants = `La moneda de la variante ${index + 1}, precio ${priceIndex + 1} debe tener 3 caracteres.`
        setIndexedError('variantsByIndex', index, 'Moneda invalida en precio de variante.')
        break
      }

      if (!Number.isFinite(priceEntry.amount) || priceEntry.amount <= 0) {
        errors.variants = `El monto de la variante ${index + 1}, precio ${priceIndex + 1} debe ser mayor a 0.`
        setIndexedError('variantsByIndex', index, 'Monto invalido en precio de variante.')
        break
      }
    }

    if (errors.variants) {
      break
    }
  }

  if ((payload.attributes ?? []).some((attribute, index) => {
    const invalid = attribute.values.length === 0
    if (invalid) {
      setIndexedError('attributesByIndex', index, 'Agrega al menos un valor para este atributo.')
    }
    return invalid
  })) {
    errors.attributes = 'Cada atributo debe tener al menos un valor.'
  }

  const firstError =
    errors.name
    ?? errors.sku
    ?? errors.category
    ?? errors.price
    ?? errors.originalPrice
    ?? errors.discountPercent
    ?? errors.currency
    ?? errors.stock
    ?? errors.attributes
    ?? errors.prices
    ?? errors.variants
    ?? errors.storeAvailability
    ?? Object.values(errors.attributesByIndex ?? {})[0]
    ?? Object.values(errors.pricesByIndex ?? {})[0]
    ?? Object.values(errors.variantsByIndex ?? {})[0]
    ?? Object.values(errors.storeAvailabilityByIndex ?? {})[0]
  if (firstError) {
    errors.summary = firstError
    return { isValid: false, errors }
  }

  return { isValid: true, errors: {} }
}

function ProductStatusBadge({ status }: { status: AdminProduct['status'] }) {
  return <Badge colorPalette={status === 'active' ? 'green' : 'gray'}>{status}</Badge>
}

function CategoryStatusBadge({ active }: { active: boolean }) {
  return <Badge colorPalette={active ? 'green' : 'gray'}>{active ? 'Activa' : 'Inactiva'}</Badge>
}

function StoreStatusBadge({ active }: { active: boolean }) {
  return <Badge colorPalette={active ? 'green' : 'gray'}>{active ? 'Activa' : 'Inactiva'}</Badge>
}

export function AdminDashboardPage() {
  const navigate = useNavigate()

  function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('HTTP 401')
  }

  const forceLogin = useCallback(() => {
    clearAdminAuthToken()
    navigate('/admin', { replace: true })
  }, [navigate])

  const [section, setSection] = useState<AdminSection>('products')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [stores, setStores] = useState<AdminStore[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [orderDetail, setOrderDetail] = useState<AdminOrder | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('active')
  const [orderReferenceFilter, setOrderReferenceFilter] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatusFilter>('active')
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<EntityStatusFilter>('active')
  const [categoryReferenceFilter, setCategoryReferenceFilter] = useState('')
  const [storeStatusFilter, setStoreStatusFilter] = useState<EntityStatusFilter>('active')
  const [storeReferenceFilter, setStoreReferenceFilter] = useState('')
  const [productOptions, setProductOptions] = useState<AdminProductOptions>({
    categories: [],
    colors: [],
    sizes: [],
  })

  const [productForm, setProductForm] = useState<CreateAdminProductInput>(defaultProductForm)
  const [productFormErrors, setProductFormErrors] = useState<ProductFormErrorMap>({})
    const [isProductOnOffer, setIsProductOnOffer] = useState(false)
  const [categoryForm, setCategoryForm] = useState<CreateAdminCategoryInput>(defaultCategoryForm)
  const [storeForm, setStoreForm] = useState<CreateAdminStoreInput>(defaultStoreForm)

  const [productEditor, setProductEditor] = useState<ProductEditorState>({
    isOpen: false,
    mode: 'create',
    productId: null,
  })
  const [isStoreAvailabilityModalOpen, setIsStoreAvailabilityModalOpen] = useState(false)
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false)

  const [categoryEditor, setCategoryEditor] = useState<CategoryEditorState>({
    isOpen: false,
    mode: 'create',
    categoryId: null,
  })

  const [storeEditor, setStoreEditor] = useState<StoreEditorState>({
    isOpen: false,
    mode: 'create',
    storeId: null,
  })

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null)

  const [feedback, setFeedback] = useState<FeedbackState>({
    isOpen: false,
    tone: 'info',
    title: '',
    message: '',
  })

  const productRepository = useMemo(() => createAdminProductRepository(), [])
  const categoryRepository = useMemo(() => createAdminCategoryRepository(), [])
  const storeRepository = useMemo(() => createAdminStoreRepository(), [])
  const orderRepository = useMemo(() => createAdminOrderRepository(), [])

  const listAdminProductsUseCase = useMemo(() => new ListAdminProductsUseCase(productRepository), [productRepository])
  const getAdminProductOptionsUseCase = useMemo(
    () => new GetAdminProductOptionsUseCase(productRepository),
    [productRepository],
  )
  const createAdminProductUseCase = useMemo(() => new CreateAdminProductUseCase(productRepository), [productRepository])
  const updateAdminProductUseCase = useMemo(() => new UpdateAdminProductUseCase(productRepository), [productRepository])

  const listAdminCategoriesUseCase = useMemo(() => new ListAdminCategoriesUseCase(categoryRepository), [categoryRepository])
  const createAdminCategoryUseCase = useMemo(() => new CreateAdminCategoryUseCase(categoryRepository), [categoryRepository])
  const updateAdminCategoryUseCase = useMemo(() => new UpdateAdminCategoryUseCase(categoryRepository), [categoryRepository])
  const listAdminStoresUseCase = useMemo(() => new ListAdminStoresUseCase(storeRepository), [storeRepository])
  const createAdminStoreUseCase = useMemo(() => new CreateAdminStoreUseCase(storeRepository), [storeRepository])
  const updateAdminStoreUseCase = useMemo(() => new UpdateAdminStoreUseCase(storeRepository), [storeRepository])

  const listAdminOrdersUseCase = useMemo(() => new ListAdminOrdersUseCase(orderRepository), [orderRepository])

  const activeProductsCount = useMemo(
    () => products.filter((product) => product.status === 'active').length,
    [products],
  )
  const inactiveProductsCount = useMemo(
    () => products.filter((product) => product.status === 'inactive').length,
    [products],
  )
  const filteredProducts = useMemo(() => {
    if (productStatusFilter === 'all') {
      return products
    }

    return products.filter((product) => product.status === productStatusFilter)
  }, [productStatusFilter, products])
  const activeCategoriesCount = useMemo(
    () => categories.filter((category) => category.active).length,
    [categories],
  )
  const inactiveCategoriesCount = useMemo(
    () => categories.filter((category) => !category.active).length,
    [categories],
  )
  const filteredCategories = useMemo(() => {
    const normalizedFilter = categoryReferenceFilter.trim().toLowerCase()
    const byStatus =
      categoryStatusFilter === 'all'
        ? categories
        : categories.filter((category) => category.active === (categoryStatusFilter === 'active'))

    if (!normalizedFilter) {
      return byStatus
    }

    return byStatus.filter((category) =>
      [category.name, category.slug, category.description].some((value) => value.toLowerCase().includes(normalizedFilter)),
    )
  }, [categories, categoryReferenceFilter, categoryStatusFilter])
  const activeStoresCount = useMemo(
    () => stores.filter((store) => store.active).length,
    [stores],
  )
  const inactiveStoresCount = useMemo(
    () => stores.filter((store) => !store.active).length,
    [stores],
  )
  const filteredStores = useMemo(() => {
    const normalizedFilter = storeReferenceFilter.trim().toLowerCase()
    const byStatus =
      storeStatusFilter === 'all'
        ? stores
        : stores.filter((store) => store.active === (storeStatusFilter === 'active'))

    if (!normalizedFilter) {
      return byStatus
    }

    return byStatus.filter((store) =>
      [store.name, store.slug, store.address, store.district, store.reference].some((value) =>
        value.toLowerCase().includes(normalizedFilter),
      ),
    )
  }, [storeReferenceFilter, storeStatusFilter, stores])
  const activeOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'active').length,
    [orders],
  )
  const inactiveOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'inactive').length,
    [orders],
  )
  const filteredOrders = useMemo(() => {
    const normalizedFilter = orderReferenceFilter.trim().toLowerCase()
    const byStatus =
      orderStatusFilter === 'all'
        ? orders
        : orders.filter((order) => order.status === orderStatusFilter)

    if (!normalizedFilter) {
      return byStatus
    }

    return byStatus.filter((order) => {
      const phone = order.customerPhone.toLowerCase()
      const firstName = order.referenceFirstName.toLowerCase()
      const lastName = order.referenceLastName.toLowerCase()

      return (
        phone.includes(normalizedFilter) ||
        firstName.includes(normalizedFilter) ||
        lastName.includes(normalizedFilter)
      )
    })
  }, [orderReferenceFilter, orderStatusFilter, orders])

  function handleOrderPaymentStatusChange(orderId: string, paymentStatus: 'pending' | 'paid') {
    const order = orders.find((entry) => entry.id === orderId)
    if (!order) {
      return
    }

    if (order.source === 'local-checkout-history') {
      setLocalCheckoutOrderPaymentStatus(orderId, paymentStatus)
    } else {
      setOrderPaymentStatusOverride(orderId, paymentStatus)
    }

    setOrders((prev) => prev.map((entry) => (entry.id === orderId ? { ...entry, paymentStatus } : entry)))
    setOrderDetail((prev) => (prev?.id === orderId ? { ...prev, paymentStatus } : prev))
  }

  const productSectionHealth = useMemo(() => {
    const basicErrors = [
      productFormErrors.name,
      productFormErrors.sku,
      productFormErrors.category,
    ].filter(Boolean).length
    const commercialErrors = [
      productFormErrors.price,
      productFormErrors.originalPrice,
      productFormErrors.discountPercent,
      productFormErrors.currency,
      productFormErrors.stock,
      productFormErrors.prices,
    ].filter(Boolean).length + countIndexedErrors(productFormErrors.pricesByIndex)
    const attributesErrors = [productFormErrors.attributes].filter(Boolean).length
      + countIndexedErrors(productFormErrors.attributesByIndex)
    const variantsErrors = [productFormErrors.variants].filter(Boolean).length
      + countIndexedErrors(productFormErrors.variantsByIndex)
    const storesErrors = [productFormErrors.storeAvailability].filter(Boolean).length
      + countIndexedErrors(productFormErrors.storeAvailabilityByIndex)

    const isVariableProduct = (productForm.productType ?? 'simple') === 'variable'
    const variantsCount = productForm.variants?.length ?? 0

    return [
      {
        key: 'basic',
        label: 'Basico',
        complete:
          productForm.name.trim().length >= 3
          && productForm.sku.trim().length >= 3
          && productForm.category.trim().length >= 2,
        errors: basicErrors,
      },
      {
        key: 'commercial',
        label: 'Comercial',
        complete: productForm.price > 0 && productForm.stock >= 0 && productForm.currency.trim().length === 3,
        errors: commercialErrors,
      },
      {
        key: 'media',
        label: 'Media',
        complete: productForm.imageUrl.trim().length > 0,
        errors: 0,
      },
      {
        key: 'attributes',
        label: 'Atributos',
        complete: (productForm.attributes?.length ?? 0) > 0,
        errors: attributesErrors,
      },
      {
        key: 'variants',
        label: 'Variantes',
        complete: !isVariableProduct || variantsCount > 0,
        errors: variantsErrors,
      },
      {
        key: 'stores',
        label: 'Tiendas',
        complete: (productForm.storeAvailability?.length ?? 0) > 0,
        errors: storesErrors,
      },
    ]
  }, [productForm, productFormErrors])

  function openFeedback(tone: ModalTone, title: string, message: string) {
    setFeedback({ isOpen: true, tone, title, message })
  }

  async function handleMainImageUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    try {
      const [dataUrl] = await filesToDataUrls(files)
      if (!dataUrl) {
        return
      }

      setProductForm((prev) => ({
        ...prev,
        imageUrl: dataUrl,
      }))
      openFeedback('info', 'Imagen principal cargada', 'Se usara esta imagen para subirla al bucket al guardar el producto.')
    } catch {
      openFeedback('error', 'Carga de imagen', 'No se pudo procesar la imagen principal seleccionada.')
    }
  }

  async function handleGalleryImagesUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    try {
      const dataUrls = await filesToDataUrls(files)
      setProductForm((prev) => ({
        ...prev,
        images: [...(prev.images ?? []), ...dataUrls],
      }))
      openFeedback('info', 'Galeria actualizada', `Se agregaron ${dataUrls.length} imagen(es) para subir al bucket.`)
    } catch {
      openFeedback('error', 'Carga de imagenes', 'No se pudieron procesar las imagenes de galeria seleccionadas.')
    }
  }

  async function handleVariantImageUpload(index: number, files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    try {
      const [dataUrl] = await filesToDataUrls(files)
      if (!dataUrl) {
        return
      }

      setProductForm((prev) => ({
        ...prev,
        variants: (prev.variants ?? []).map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, imageUrl: dataUrl } : entry,
        ),
      }))
      openFeedback('info', 'Imagen de variante cargada', `La variante ${index + 1} usara esta imagen al guardar.`)
    } catch {
      openFeedback('error', 'Carga de variante', 'No se pudo procesar la imagen de variante seleccionada.')
    }
  }

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const [productsData, categoriesData, storesData, ordersData, productOptionsData] = await Promise.all([
        listAdminProductsUseCase.execute(),
        listAdminCategoriesUseCase.execute(),
        listAdminStoresUseCase.execute(),
        listAdminOrdersUseCase.execute(),
        getAdminProductOptionsUseCase.execute(),
      ])

      setProducts(productsData)
      setCategories(categoriesData)
      setStores(storesData)
      setOrders(ordersData)
      setProductOptions(productOptionsData)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        forceLogin()
        return
      }

      setErrorMessage(
        'No se pudo cargar el modulo admin. Verifica VITE_ADMIN_API_BASE_URL y VITE_ECOMMERCE_API_BASE_URL.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    forceLogin,
    listAdminCategoriesUseCase,
    listAdminOrdersUseCase,
    getAdminProductOptionsUseCase,
    listAdminProductsUseCase,
    listAdminStoresUseCase,
  ])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadAllData()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [loadAllData])

  function openCreateProductModal() {
    setProductFormErrors({})
    setProductForm(defaultProductForm)
      setIsProductOnOffer(false)
    setIsStoreAvailabilityModalOpen(false)
    setIsVariantsModalOpen(false)
    setProductEditor({ isOpen: true, mode: 'create', productId: null })
  }

  function openUpdateProductModal(product: AdminProduct) {
        setIsProductOnOffer(
          Boolean(
            (product.originalPrice && product.originalPrice > product.price)
            || (product.discountPercent && product.discountPercent > 0),
          ),
        )
    setProductFormErrors({})
    setProductForm({
      name: product.name,
      sku: product.sku,
      variantGroup: product.variantGroup,
      description: product.description,
      category: product.category,
      categories: product.categories ?? [product.category],
      imageUrl: product.imageUrl,
      images: product.images ?? [],
      colors: product.colors ?? [],
      sizes: product.sizes ?? [],
      productType: product.productType ?? (product.variants && product.variants.length > 0 ? 'variable' : 'simple'),
      attributes: product.attributes ?? [],
      variants: product.variants ?? [],
      inventory: product.inventory ?? { quantity: product.stock, inStock: product.stock > 0 },
      prices:
        product.prices && product.prices.length > 0
          ? product.prices
          : [{
              currency: product.currency,
              amount: product.price,
              originalAmount: product.originalPrice,
              discountPercent: product.discountPercent,
            }],
      storeAvailability: product.storeAvailability ?? [],
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      currency: product.currency,
      stock: product.stock,
      featured: product.featured,
      status: product.status,
    })
    setIsStoreAvailabilityModalOpen(false)
    setIsVariantsModalOpen(false)
    setProductEditor({ isOpen: true, mode: 'update', productId: product.id })
  }

  async function submitProduct() {
    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const normalizedPayload = normalizeProductPayload(productForm)
      const validation = validateProductPayload(normalizedPayload, isProductOnOffer)

      if (!validation.isValid) {
        setProductFormErrors(validation.errors)
        openFeedback('error', 'Validacion de producto', validation.errors.summary ?? 'Revisa los campos del formulario.')
        return
      }

      setProductFormErrors({})

      if (productEditor.mode === 'create') {
        const created = await createAdminProductUseCase.execute(normalizedPayload)
        setProducts((prev) => [created, ...prev])
        openFeedback('success', 'Producto creado', 'El producto se registro correctamente.')
      } else if (productEditor.productId) {
        const updated = await updateAdminProductUseCase.execute({
          id: productEditor.productId,
          ...normalizedPayload,
        })

        setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)))
        openFeedback('success', 'Producto actualizado', 'Los cambios del producto se guardaron.')
      }

      setProductEditor({ isOpen: false, mode: 'create', productId: null })
      setIsProductOnOffer(false)
      setProductForm(defaultProductForm)
      setProductFormErrors({})
    } catch (error) {
      if (isUnauthorizedError(error)) {
        forceLogin()
        return
      }

      openFeedback('error', 'Operacion no completada', 'No fue posible guardar el producto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCreateCategoryModal() {
    setCategoryForm(defaultCategoryForm)
    setCategoryEditor({ isOpen: true, mode: 'create', categoryId: null })
  }

  function openUpdateCategoryModal(category: AdminCategory) {
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
    })
    setCategoryEditor({ isOpen: true, mode: 'update', categoryId: category.id })
  }

  async function submitCategory() {
    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const normalizedPayload = normalizeCategoryPayload(categoryForm)
      const validation = validateCategoryPayload(normalizedPayload)

      setCategoryForm(normalizedPayload)

      if (!validation.isValid) {
        openFeedback('error', 'Validacion de categoria', validation.message ?? 'Revisa los datos de categoria.')
        return
      }

      if (categoryEditor.mode === 'create') {
        const created = await createAdminCategoryUseCase.execute(normalizedPayload)
        setCategories((prev) => [created, ...prev])
        setProductOptions((prev) => ({
          ...prev,
          categories: [created, ...prev.categories],
        }))
        openFeedback('success', 'Categoria creada', 'La categoria se registro correctamente.')
      } else if (categoryEditor.categoryId) {
        const updated = await updateAdminCategoryUseCase.execute({
          id: categoryEditor.categoryId,
          ...normalizedPayload,
        })

        setCategories((prev) => prev.map((category) => (category.id === updated.id ? updated : category)))
        setProductOptions((prev) => ({
          ...prev,
          categories: prev.categories.map((category) => (category.id === updated.id ? updated : category)),
        }))
        openFeedback('success', 'Categoria actualizada', 'Los cambios de categoria se guardaron.')
      }

      setCategoryEditor({ isOpen: false, mode: 'create', categoryId: null })
      setCategoryForm(defaultCategoryForm)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        forceLogin()
        return
      }

      if (error instanceof Error && error.message.includes('Invalid category slug format')) {
        openFeedback('error', 'Slug invalido', 'Usa solo minusculas, numeros y guiones en el slug (ej. joyas-finas).')
        return
      }

      if (error instanceof Error && error.message.includes('Category slug already exists')) {
        openFeedback('error', 'Slug duplicado', 'Ya existe una categoria con ese slug. Usa uno diferente.')
        return
      }

      openFeedback('error', 'Operacion no completada', 'No fue posible guardar la categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCreateStoreModal() {
    setStoreForm(defaultStoreForm)
    setStoreEditor({ isOpen: true, mode: 'create', storeId: null })
  }

  function openUpdateStoreModal(store: AdminStore) {
    setStoreForm({
      name: store.name,
      slug: store.slug,
      address: store.address,
      district: store.district,
      reference: store.reference,
      pickupEnabled: store.pickupEnabled,
      courierEnabled: store.courierEnabled,
      active: store.active,
    })
    setStoreEditor({ isOpen: true, mode: 'update', storeId: store.id })
  }

  async function submitStore() {
    try {
      setIsSubmitting(true)
      setErrorMessage('')

      if (storeEditor.mode === 'create') {
        const created = await createAdminStoreUseCase.execute(storeForm)
        setStores((prev) => [created, ...prev])
        openFeedback('success', 'Tienda creada', 'La tienda se registro correctamente.')
      } else if (storeEditor.storeId) {
        const updated = await updateAdminStoreUseCase.execute({
          id: storeEditor.storeId,
          ...storeForm,
        })

        setStores((prev) => prev.map((store) => (store.id === updated.id ? updated : store)))
        openFeedback('success', 'Tienda actualizada', 'Los cambios de tienda se guardaron.')
      }

      setStoreEditor({ isOpen: false, mode: 'create', storeId: null })
      setStoreForm(defaultStoreForm)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        forceLogin()
        return
      }

      openFeedback('error', 'Operacion no completada', 'No fue posible guardar la tienda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      return
    }

    try {
      setIsSubmitting(true)

      if (confirmDelete.entity === 'product') {
        const product = products.find((entry) => entry.id === confirmDelete.id)

        if (!product) {
          openFeedback('error', 'Producto no encontrado', 'No se encontro el producto seleccionado.')
          return
        }

        await updateAdminProductUseCase.execute({
          ...product,
          status: 'inactive',
        })

        setProducts((prev) => prev.map((entry) => (entry.id === product.id ? { ...entry, status: 'inactive' } : entry)))
        openFeedback('success', 'Producto eliminado', 'El producto fue marcado como inactivo.')
      }

      if (confirmDelete.entity === 'category') {
        const category = categories.find((entry) => entry.id === confirmDelete.id)

        if (!category) {
          openFeedback('error', 'Categoria no encontrada', 'No se encontro la categoria seleccionada.')
          return
        }

        await updateAdminCategoryUseCase.execute({
          ...category,
          active: false,
        })

        setCategories((prev) => prev.filter((entry) => entry.id !== category.id))
        setProductOptions((prev) => ({
          ...prev,
          categories: prev.categories.filter((entry) => entry.id !== category.id),
        }))
        openFeedback('success', 'Categoria eliminada', 'La categoria fue desactivada y retirada de la tabla.')
      }

      if (confirmDelete.entity === 'store') {
        const store = stores.find((entry) => entry.id === confirmDelete.id)

        if (!store) {
          openFeedback('error', 'Tienda no encontrada', 'No se encontro la tienda seleccionada.')
          return
        }

        await updateAdminStoreUseCase.execute({
          ...store,
          active: false,
        })

        setStores((prev) => prev.filter((entry) => entry.id !== store.id))
        openFeedback('success', 'Tienda eliminada', 'La tienda fue desactivada y retirada de la tabla.')
      }

      if (confirmDelete.entity === 'order') {
        const order = orders.find((entry) => entry.id === confirmDelete.id)

        if (!order) {
          openFeedback('error', 'Orden no encontrada', 'No se encontro la orden seleccionada.')
          return
        }

        if (order.source === 'local-checkout-history') {
          setLocalCheckoutOrderStatus(order.id, 'inactive')
        } else {
          setOrderStatusOverride(order.id, 'inactive')
        }

        setOrders((prev) => prev.map((entry) => (entry.id === order.id ? { ...entry, status: 'inactive' } : entry)))
        setOrderDetail((prev) =>
          prev?.id === order.id
            ? {
              ...prev,
              status: 'inactive',
            }
            : prev,
        )

        openFeedback('success', 'Orden inactivada', 'La orden fue marcada como inactiva.')
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        forceLogin()
        return
      }

      openFeedback('error', 'Eliminacion no completada', 'No fue posible completar la eliminacion.')
    } finally {
      setConfirmDelete(null)
      setIsSubmitting(false)
    }
  }

  function renderStoresTable() {
    return (
      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="blackAlpha.200" p={5}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <VStack align="start" gap={1}>
            <Heading size="md" color="#0f172a">
              Tiendas
            </Heading>
            <HStack gap={2}>
              <Button
                size="xs"
                variant={storeStatusFilter === 'active' ? 'solid' : 'outline'}
                bg={storeStatusFilter === 'active' ? '#0f766e' : 'white'}
                color={storeStatusFilter === 'active' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setStoreStatusFilter('active')}
              >
                Activas: {activeStoresCount}
              </Button>
              <Button
                size="xs"
                variant={storeStatusFilter === 'inactive' ? 'solid' : 'outline'}
                bg={storeStatusFilter === 'inactive' ? '#475569' : 'white'}
                color={storeStatusFilter === 'inactive' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setStoreStatusFilter('inactive')}
              >
                Inactivas: {inactiveStoresCount}
              </Button>
              <Button
                size="xs"
                variant={storeStatusFilter === 'all' ? 'solid' : 'outline'}
                bg={storeStatusFilter === 'all' ? '#1e293b' : 'white'}
                color={storeStatusFilter === 'all' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setStoreStatusFilter('all')}
              >
                Todas: {stores.length}
              </Button>
            </HStack>
          </VStack>
          <VStack align={{ base: 'stretch', md: 'end' }} gap={2} width={{ base: '100%', md: '420px' }}>
            <Input
              value={storeReferenceFilter}
              onChange={(event) => setStoreReferenceFilter(event.target.value)}
              placeholder="Filtrar por nombre, distrito, dirección o slug"
              bg="white"
            />
            <HStack justify="end" width="100%">
              <Button variant="outline" borderColor="#cbd5e1" onClick={() => void loadAllData()} loading={isLoading}>
                Recargar
              </Button>
              <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} onClick={openCreateStoreModal}>
                Agregar tienda
              </Button>
            </HStack>
          </VStack>
        </Flex>

        <Box overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" minW="980px">
            <Box as="thead" bg="#f8fafc">
              <Box as="tr">
                <Box as="th" p={3} textAlign="left">
                  Nombre
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Slug
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Direccion
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Distrito
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Modos
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Estado
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Acciones
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredStores.map((store) => (
                <Box as="tr" key={store.id} borderTop="1px solid" borderColor="#e2e8f0">
                  <Box as="td" p={3}>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="semibold" color="#17222f">
                        {store.name}
                      </Text>
                      <Text fontSize="xs" color="#64748b">
                        {store.reference}
                      </Text>
                    </VStack>
                  </Box>
                  <Box as="td" p={3}>
                    {store.slug}
                  </Box>
                  <Box as="td" p={3}>
                    {store.address}
                  </Box>
                  <Box as="td" p={3}>
                    {store.district}
                  </Box>
                  <Box as="td" p={3}>
                    <HStack>
                      <Badge colorPalette={store.pickupEnabled ? 'teal' : 'gray'}>Retiro</Badge>
                      <Badge colorPalette={store.courierEnabled ? 'blue' : 'gray'}>Courier</Badge>
                    </HStack>
                  </Box>
                  <Box as="td" p={3}>
                    <StoreStatusBadge active={store.active} />
                  </Box>
                  <Box as="td" p={3}>
                    <HStack>
                      <Button size="xs" variant="outline" borderColor="#cbd5e1" onClick={() => openUpdateStoreModal(store)}>
                        Actualizar
                      </Button>
                      <Button
                        size="xs"
                        bg="#b91c1c"
                        color="white"
                        _hover={{ bg: '#991b1b' }}
                        onClick={() => setConfirmDelete({ isOpen: true, entity: 'store', id: store.id })}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  function renderSidebarButton(target: AdminSection, label: string) {
    const active = section === target

    return (
      <Button
        key={target}
        size="sm"
        width="100%"
        justifyContent={isSidebarOpen ? 'start' : 'center'}
        variant={active ? 'solid' : 'outline'}
        bg={active ? '#0f172a' : 'white'}
        color={active ? 'white' : '#334155'}
        borderColor="#cbd5e1"
        onClick={() => setSection(target)}
      >
        {isSidebarOpen ? label : label.charAt(0)}
      </Button>
    )
  }

  const comboStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    background: '#ffffff',
    color: '#0f172a',
    minHeight: '44px',
  }

  function renderProductsTable() {
    return (
      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="blackAlpha.200" p={5}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <VStack align="start" gap={1}>
            <Heading size="md" color="#0f172a">
              Productos
            </Heading>
            <HStack gap={2}>
              <Button
                size="xs"
                variant={productStatusFilter === 'active' ? 'solid' : 'outline'}
                bg={productStatusFilter === 'active' ? '#0f766e' : 'white'}
                color={productStatusFilter === 'active' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setProductStatusFilter('active')}
              >
                Activos: {activeProductsCount}
              </Button>
              <Button
                size="xs"
                variant={productStatusFilter === 'inactive' ? 'solid' : 'outline'}
                bg={productStatusFilter === 'inactive' ? '#475569' : 'white'}
                color={productStatusFilter === 'inactive' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setProductStatusFilter('inactive')}
              >
                Inactivos: {inactiveProductsCount}
              </Button>
              <Button
                size="xs"
                variant={productStatusFilter === 'all' ? 'solid' : 'outline'}
                bg={productStatusFilter === 'all' ? '#1e293b' : 'white'}
                color={productStatusFilter === 'all' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setProductStatusFilter('all')}
              >
                Todos: {products.length}
              </Button>
            </HStack>
          </VStack>
          <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} onClick={openCreateProductModal}>
            Agregar producto
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" minW="1100px">
            <Box as="thead" bg="#f8fafc">
              <Box as="tr">
                <Box as="th" p={3} textAlign="left">
                  Nombre
                </Box>
                <Box as="th" p={3} textAlign="left">
                  SKU
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Categoria
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Modelo
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Precio
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Stock
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Resumen
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Estado
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Acciones
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredProducts.map((product) => (
                <Box as="tr" key={product.id} borderTop="1px solid" borderColor="#e2e8f0">
                  <Box as="td" p={3}>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="semibold" color="#17222f">
                        {product.name}
                      </Text>
                      <Text fontSize="xs" color="#64748b">
                        {product.description}
                      </Text>
                    </VStack>
                  </Box>
                  <Box as="td" p={3}>
                    {product.sku}
                  </Box>
                  <Box as="td" p={3}>
                    {product.category}
                  </Box>
                  <Box as="td" p={3}>
                    <Badge colorPalette={product.productType === 'variable' ? 'blue' : 'gray'}>
                      {product.productType === 'variable' ? 'Variable' : 'Simple'}
                    </Badge>
                  </Box>
                  <Box as="td" p={3}>
                    {formatCurrency(product.price)}
                  </Box>
                  <Box as="td" p={3}>
                    {product.stock}
                  </Box>
                  <Box as="td" p={3}>
                    <VStack align="start" gap={1}>
                      <Badge colorPalette="purple" variant="subtle">
                        Variantes: {product.variants?.length ?? 0}
                      </Badge>
                      <Badge colorPalette="teal" variant="subtle">
                        Tiendas: {(product.storeAvailability ?? []).filter((entry) => entry.available).length}
                      </Badge>
                    </VStack>
                  </Box>
                  <Box as="td" p={3}>
                    <ProductStatusBadge status={product.status} />
                  </Box>
                  <Box as="td" p={3}>
                    <HStack>
                      <Button size="xs" variant="outline" borderColor="#cbd5e1" onClick={() => openUpdateProductModal(product)}>
                        Actualizar
                      </Button>
                      <Button
                        size="xs"
                        bg="#b91c1c"
                        color="white"
                        _hover={{ bg: '#991b1b' }}
                        onClick={() => setConfirmDelete({ isOpen: true, entity: 'product', id: product.id })}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  function renderCategoriesTable() {
    return (
      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="blackAlpha.200" p={5}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <VStack align="start" gap={1}>
            <Heading size="md" color="#0f172a">
              Categorias
            </Heading>
            <HStack gap={2}>
              <Button
                size="xs"
                variant={categoryStatusFilter === 'active' ? 'solid' : 'outline'}
                bg={categoryStatusFilter === 'active' ? '#0f766e' : 'white'}
                color={categoryStatusFilter === 'active' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setCategoryStatusFilter('active')}
              >
                Activas: {activeCategoriesCount}
              </Button>
              <Button
                size="xs"
                variant={categoryStatusFilter === 'inactive' ? 'solid' : 'outline'}
                bg={categoryStatusFilter === 'inactive' ? '#475569' : 'white'}
                color={categoryStatusFilter === 'inactive' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setCategoryStatusFilter('inactive')}
              >
                Inactivas: {inactiveCategoriesCount}
              </Button>
              <Button
                size="xs"
                variant={categoryStatusFilter === 'all' ? 'solid' : 'outline'}
                bg={categoryStatusFilter === 'all' ? '#1e293b' : 'white'}
                color={categoryStatusFilter === 'all' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setCategoryStatusFilter('all')}
              >
                Todas: {categories.length}
              </Button>
            </HStack>
          </VStack>
          <VStack align={{ base: 'stretch', md: 'end' }} gap={2} width={{ base: '100%', md: '420px' }}>
            <Input
              value={categoryReferenceFilter}
              onChange={(event) => setCategoryReferenceFilter(event.target.value)}
              placeholder="Filtrar por nombre, slug o descripción"
              bg="white"
            />
            <HStack justify="end" width="100%">
              <Button variant="outline" borderColor="#cbd5e1" onClick={() => void loadAllData()} loading={isLoading}>
                Recargar
              </Button>
              <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} onClick={openCreateCategoryModal}>
                Agregar categoria
              </Button>
            </HStack>
          </VStack>
        </Flex>

        <Box overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" minW="760px">
            <Box as="thead" bg="#f8fafc">
              <Box as="tr">
                <Box as="th" p={3} textAlign="left">
                  Nombre
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Slug
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Descripcion
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Estado
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Acciones
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredCategories.map((category) => (
                <Box as="tr" key={category.id} borderTop="1px solid" borderColor="#e2e8f0">
                  <Box as="td" p={3}>
                    {category.name}
                  </Box>
                  <Box as="td" p={3}>
                    {category.slug}
                  </Box>
                  <Box as="td" p={3}>
                    {category.description}
                  </Box>
                  <Box as="td" p={3}>
                    <CategoryStatusBadge active={category.active} />
                  </Box>
                  <Box as="td" p={3}>
                    <HStack>
                      <Button size="xs" variant="outline" borderColor="#cbd5e1" onClick={() => openUpdateCategoryModal(category)}>
                        Actualizar
                      </Button>
                      <Button
                        size="xs"
                        bg="#b91c1c"
                        color="white"
                        _hover={{ bg: '#991b1b' }}
                        onClick={() => setConfirmDelete({ isOpen: true, entity: 'category', id: category.id })}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  function renderOrdersTable() {
    return (
      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="blackAlpha.200" p={5}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <VStack align="start" gap={1}>
            <Heading size="md" color="#0f172a">
              Ordenes
            </Heading>
            <HStack gap={2}>
              <Button
                size="xs"
                variant={orderStatusFilter === 'active' ? 'solid' : 'outline'}
                bg={orderStatusFilter === 'active' ? '#0f766e' : 'white'}
                color={orderStatusFilter === 'active' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setOrderStatusFilter('active')}
              >
                Activas: {activeOrdersCount}
              </Button>
              <Button
                size="xs"
                variant={orderStatusFilter === 'inactive' ? 'solid' : 'outline'}
                bg={orderStatusFilter === 'inactive' ? '#475569' : 'white'}
                color={orderStatusFilter === 'inactive' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setOrderStatusFilter('inactive')}
              >
                Inactivas: {inactiveOrdersCount}
              </Button>
              <Button
                size="xs"
                variant={orderStatusFilter === 'all' ? 'solid' : 'outline'}
                bg={orderStatusFilter === 'all' ? '#1e293b' : 'white'}
                color={orderStatusFilter === 'all' ? 'white' : '#334155'}
                borderColor="#94a3b8"
                onClick={() => setOrderStatusFilter('all')}
              >
                Todas: {orders.length}
              </Button>
            </HStack>
          </VStack>
          <VStack align={{ base: 'stretch', md: 'end' }} gap={2} width={{ base: '100%', md: '420px' }}>
            <Input
              value={orderReferenceFilter}
              onChange={(event) => setOrderReferenceFilter(event.target.value)}
              placeholder="Filtrar por celular, nombre o apellido"
              bg="white"
            />
            <Button variant="outline" borderColor="#cbd5e1" onClick={() => void loadAllData()} loading={isLoading}>
              Recargar
            </Button>
          </VStack>
        </Flex>

        <Box overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" minW="1120px">
            <Box as="thead" bg="#f8fafc">
              <Box as="tr">
                <Box as="th" p={3} textAlign="left">
                  Orden
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Fecha
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Items
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Subtotal
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Fuente
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Referencia
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Estado
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Pago
                </Box>
                <Box as="th" p={3} textAlign="left">
                  Acciones
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredOrders.map((order) => (
                <Box as="tr" key={order.id} borderTop="1px solid" borderColor="#e2e8f0">
                  <Box as="td" p={3}>
                    {order.id.slice(0, 8)}
                  </Box>
                  <Box as="td" p={3}>
                    {new Date(order.createdAt).toLocaleString('es-PE')}
                  </Box>
                  <Box as="td" p={3}>
                    {order.itemCount}
                  </Box>
                  <Box as="td" p={3}>
                    {formatCurrency(order.subtotal)}
                  </Box>
                  <Box as="td" p={3}>
                    <Badge colorPalette={order.source === 'api' ? 'teal' : 'orange'}>
                      {order.source === 'api' ? 'API ecommerce' : 'Historial local'}
                    </Badge>
                  </Box>
                  <Box as="td" p={3}>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="semibold" color="#0f172a" fontSize="sm">
                        {`${order.referenceFirstName || '-'} ${order.referenceLastName || ''}`.trim() || '-'}
                      </Text>
                      <Text color="#64748b" fontSize="xs">{order.customerPhone || '-'}</Text>
                    </VStack>
                  </Box>
                  <Box as="td" p={3}>
                    <Badge colorPalette={order.status === 'active' ? 'green' : 'gray'}>
                      {order.status === 'active' ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </Box>
                  <Box as="td" p={3}>
                    <select
                      value={order.paymentStatus}
                      onChange={(event) =>
                        handleOrderPaymentStatusChange(
                          order.id,
                          event.target.value === 'paid' ? 'paid' : 'pending',
                        )
                      }
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        padding: '6px 8px',
                        background: '#ffffff',
                        color: '#0f172a',
                        minWidth: '112px',
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                    </select>
                  </Box>
                  <Box as="td" p={3}>
                    <HStack>
                      <Button size="xs" variant="outline" borderColor="#cbd5e1" onClick={() => setOrderDetail(order)}>
                        Ver detalle
                      </Button>
                      <Button
                        size="xs"
                        bg="#b91c1c"
                        color="white"
                        _hover={{ bg: '#991b1b' }}
                        disabled={order.status === 'inactive'}
                        onClick={() => setConfirmDelete({ isOpen: true, entity: 'order', id: order.id })}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box minH="100dvh" className="app-bg">
      <Container maxW="8xl" py={{ base: 4, md: 8 }}>
        <VStack align="stretch" gap={4}>
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
            <VStack align="start" gap={1}>
              <BrandLogo size={52} showText />
              <Text letterSpacing="0.14em" fontWeight="bold" textTransform="uppercase" color="#0f766e">
                Admin module
              </Text>
              <Heading size={{ base: 'lg', md: '2xl' }} color="#0f172a" fontFamily="'Space Grotesk', sans-serif">
                Panel administrativo
              </Heading>
            </VStack>

            <HStack>
              <Button
                variant="outline"
                borderColor="#cbd5e1"
                onClick={() => {
                  clearAdminAuthToken()
                  navigate('/admin', { replace: true })
                }}
              >
                Cerrar sesion
              </Button>
              <Button variant="outline" borderColor="#cbd5e1" onClick={() => navigate('/')}>
                Ir a tienda
              </Button>
              <Button bg="#0f172a" color="white" _hover={{ bg: '#1f2937' }} onClick={() => void loadAllData()} loading={isLoading}>
                Refrescar
              </Button>
            </HStack>
          </Flex>

          {errorMessage ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Error en admin</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <Flex gap={4} align="start" direction={{ base: 'column', md: 'row' }}>
            <Box
              width={{ base: '100%', md: isSidebarOpen ? '260px' : '72px' }}
              bg="white"
              borderRadius="2xl"
              border="1px solid"
              borderColor="blackAlpha.200"
              p={3}
              boxShadow="sm"
              position={{ md: 'sticky' }}
              top={{ md: 16 }}
            >
              <VStack align="stretch" gap={2}>
                <Button size="sm" variant="outline" borderColor="#cbd5e1" onClick={() => setIsSidebarOpen((prev) => !prev)}>
                  {isSidebarOpen ? 'Ocultar menu' : 'Menu'}
                </Button>
                <Separator />
                {renderSidebarButton('products', 'Productos')}
                {renderSidebarButton('categories', 'Categorias')}
                {renderSidebarButton('stores', 'Tiendas')}
                {renderSidebarButton('orders', 'Ordenes')}
              </VStack>
            </Box>

            <Box flex="1" width="100%">
              {section === 'products' ? renderProductsTable() : null}
              {section === 'categories' ? renderCategoriesTable() : null}
              {section === 'stores' ? renderStoresTable() : null}
              {section === 'orders' ? renderOrdersTable() : null}
            </Box>
          </Flex>
        </VStack>
      </Container>

      <ModalShell
        isOpen={productEditor.isOpen}
        title={productEditor.mode === 'create' ? 'Agregar producto' : 'Actualizar producto'}
        onClose={() => {
          setProductFormErrors({})
          setIsProductOnOffer(false)
          setIsStoreAvailabilityModalOpen(false)
          setIsVariantsModalOpen(false)
          setProductEditor({ isOpen: false, mode: 'create', productId: null })
        }}
      >
        <VStack align="stretch" gap={3}>
          {productFormErrors.summary ? (
            <Alert.Root status="error" borderRadius="xl" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{productFormErrors.summary}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <Box border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={3} bg="#f8fafc">
            <VStack align="stretch" gap={2}>
              <Text fontWeight="semibold" color="#0f172a">
                Estado del formulario
              </Text>
              <Flex wrap="wrap" gap={2}>
                {productSectionHealth.map((section) => (
                  <HStack key={section.key} border="1px solid" borderColor="#cbd5e1" borderRadius="full" px={3} py={1} bg="white" gap={2}>
                    <Badge colorPalette={section.complete ? 'green' : 'gray'} variant="subtle">
                      {section.complete ? 'Completa' : 'Pendiente'}
                    </Badge>
                    <Text fontSize="xs" color="#334155" fontWeight="semibold">
                      {section.label}
                    </Text>
                    {section.errors > 0 ? (
                      <Badge colorPalette="red" variant="solid">
                        {section.errors} error{section.errors === 1 ? '' : 'es'}
                      </Badge>
                    ) : null}
                  </HStack>
                ))}
              </Flex>
            </VStack>
          </Box>

          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Nombre del producto" error={productFormErrors.name}>
              <Input borderColor={productFormErrors.name ? '#b91c1c' : undefined} placeholder="Ej. Camisa Oxford Azul" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} />
            </FormField>
            <FormField label="SKU" error={productFormErrors.sku}>
              <Input borderColor={productFormErrors.sku ? '#b91c1c' : undefined} placeholder="Ej. OXF-AZ-001" value={productForm.sku} onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))} />
            </FormField>
            <FormField label="Grupo de variante" helper="Identifica productos del mismo modelo (ej: OXF-CLASSIC).">
              <Input
                placeholder="Ej. OXF-CLASSIC"
                value={productForm.variantGroup ?? ''}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    variantGroup: event.target.value.trim().length === 0 ? undefined : event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Categoria" error={productFormErrors.category}>
              <select
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                style={{ ...comboStyle, borderColor: productFormErrors.category ? '#b91c1c' : '#cbd5e1' }}
              >
                <option value="">Selecciona una categoria</option>
                {productOptions.categories
                  .filter((category) => category.active)
                  .map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </FormField>
            <FormField label="Tipo de producto" helper="Simple o variable segun su estructura comercial.">
              <select
                value={productForm.productType ?? 'simple'}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    productType: event.target.value === 'variable' ? 'variable' : 'simple',
                  }))
                }
                style={comboStyle}
              >
                <option value="simple">Simple</option>
                <option value="variable">Variable</option>
              </select>
            </FormField>
          </HStack>

          <FormField label="Categorias adicionales" helper="Selecciona categorias complementarias para el producto.">
            <select
              multiple
              value={productForm.categories ?? []}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  categories: parseMultiSelectValues(event.target),
                }))
              }
              style={{ ...comboStyle, minHeight: '128px' }}
            >
              {productOptions.categories
                .filter((category) => category.active)
                .map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Descripcion">
            <Textarea
              placeholder="Describe el producto en pocas lineas"
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
              minH="160px"
              maxH="320px"
              resize="vertical"
              overflowY="auto"
            />
          </FormField>

          <FormField label="Imagen principal (URL)">
            <VStack align="stretch" gap={2}>
              <Input
                placeholder="https://..."
                value={productForm.imageUrl}
                onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void handleMainImageUpload(event.target.files)
                  event.target.value = ''
                }}
              />
              <Text fontSize="xs" color="#64748b">
                Puedes pegar una URL o seleccionar un archivo para subirlo al bucket al guardar.
              </Text>
              {isHttpImageReference(productForm.imageUrl) ? (
                <Box border="1px solid" borderColor="#e2e8f0" borderRadius="lg" p={2} bg="#f8fafc">
                  <VStack align="stretch" gap={2}>
                    <img
                      src={productForm.imageUrl}
                      alt="Preview imagen principal"
                      style={{
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        background: 'white',
                      }}
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="#cbd5e1"
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          imageUrl: '',
                        }))
                      }
                    >
                      Quitar imagen principal
                    </Button>
                  </VStack>
                </Box>
              ) : null}
            </VStack>
          </FormField>

          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Galeria de imagenes" helper="Separa las URLs con coma.">
              <VStack align="stretch" gap={2}>
                <Input
                  placeholder="https://img1..., https://img2..."
                  value={(productForm.images ?? []).join(', ')}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      images: parseCommaSeparatedValue(event.target.value),
                    }))
                  }
                />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    void handleGalleryImagesUpload(event.target.files)
                    event.target.value = ''
                  }}
                />
                <Text fontSize="xs" color="#64748b">
                  Tambien puedes seleccionar varias imagenes desde tu equipo.
                </Text>
                {(productForm.images ?? []).length > 0 ? (
                  <VStack align="stretch" gap={2}>
                    {(productForm.images ?? []).map((imageRef, imageIndex) => (
                      <Box
                        key={`gallery-preview-${imageIndex}`}
                        border="1px solid"
                        borderColor="#e2e8f0"
                        borderRadius="lg"
                        p={2}
                        bg="#f8fafc"
                      >
                        <HStack align="start" gap={2}>
                          {isHttpImageReference(imageRef) ? (
                            <img
                              src={imageRef}
                              alt={`Preview galeria ${imageIndex + 1}`}
                              style={{
                                width: '84px',
                                height: '84px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                background: 'white',
                              }}
                            />
                          ) : null}
                          <VStack align="stretch" flex="1" gap={1}>
                            <Text
                              fontSize="xs"
                              color="#334155"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {imageRef}
                            </Text>
                            <Button
                              size="xs"
                              variant="outline"
                              borderColor="#cbd5e1"
                              onClick={() =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  images: (prev.images ?? []).filter((_, currentIndex) => currentIndex !== imageIndex),
                                }))
                              }
                            >
                              Quitar
                            </Button>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                ) : null}
              </VStack>
            </FormField>
            <FormField label="Colores" helper="Selecciona uno o varios colores.">
              <select
                multiple
                value={productForm.colors ?? []}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    colors: parseMultiSelectValues(event.target),
                  }))
                }
                style={{ ...comboStyle, minHeight: '128px' }}
              >
                {productOptions.colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Tallas" helper="Selecciona una o varias tallas.">
              <select
                multiple
                value={productForm.sizes ?? []}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    sizes: parseMultiSelectValues(event.target),
                  }))
                }
                style={{ ...comboStyle, minHeight: '128px' }}
              >
                {productOptions.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </FormField>
          </HStack>

          <Box border="1px solid" borderColor="#e2e8f0" borderRadius="lg" p={3} bg="#f8fafc">
            <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" color="#0f172a">Con oferta</Text>
                <Text fontSize="xs" color="#64748b">Activa el precio original y el descuento automatico.</Text>
              </VStack>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  aria-label="Con oferta"
                  checked={isProductOnOffer}
                  onChange={(event) => {
                    const isChecked = event.target.checked
                    setIsProductOnOffer(isChecked)
                    if (!isChecked) {
                      setProductForm((prev) => ({
                        ...prev,
                        originalPrice: undefined,
                        discountPercent: undefined,
                      }))
                    }
                  }}
                />
                <Text fontSize="sm" fontWeight="semibold">{isProductOnOffer ? 'Si' : 'No'}</Text>
              </label>
            </HStack>
          </Box>

          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Precio actual" helper="Precio que paga el cliente." error={productFormErrors.price}>
              <Input
                borderColor={productFormErrors.price ? '#b91c1c' : undefined}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={String(productForm.price)}
                onChange={(event) => {
                  const price = Number(event.target.value)
                  setProductForm((prev) => (
                    isProductOnOffer
                      ? { ...prev, ...updateOfferFromPrice(prev, price) }
                      : { ...prev, price }
                  ))
                }}
              />
            </FormField>
            <FormField label="Precio original" helper="Precio regular antes de la oferta." error={productFormErrors.originalPrice}>
              <Input
                borderColor={productFormErrors.originalPrice ? '#b91c1c' : undefined}
                type="number"
                min="0"
                step="0.01"
                disabled={!isProductOnOffer}
                placeholder={isProductOnOffer ? '0' : 'Activa Con oferta'}
                value={productForm.originalPrice === undefined ? '' : String(productForm.originalPrice)}
                onChange={(event) => {
                  const originalPrice = event.target.value.trim().length === 0
                    ? undefined
                    : Number(event.target.value)
                  setProductForm((prev) => ({
                    ...prev,
                    ...updateOfferFromOriginalPrice(prev, originalPrice),
                  }))
                }}
              />
            </FormField>
            <FormField label="Descuento (%)" helper="Se calcula con los precios o completa el precio faltante." error={productFormErrors.discountPercent}>
              <Input
                borderColor={productFormErrors.discountPercent ? '#b91c1c' : undefined}
                type="number"
                min="1"
                max="90"
                step="1"
                disabled={!isProductOnOffer}
                placeholder={isProductOnOffer ? 'Ej. 20' : 'Activa Con oferta'}
                value={productForm.discountPercent === undefined ? '' : String(productForm.discountPercent)}
                onChange={(event) => {
                  const discountPercent = event.target.value.trim().length === 0
                    ? undefined
                    : Number(event.target.value)
                  setProductForm((prev) => ({
                    ...prev,
                    ...updateOfferFromDiscount(prev, discountPercent),
                  }))
                }}
              />
            </FormField>
          </HStack>

          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Moneda" error={productFormErrors.currency}>
              <Input
                borderColor={productFormErrors.currency ? '#b91c1c' : undefined}
                placeholder="PEN"
                value={productForm.currency}
                onChange={(event) => setProductForm((prev) => ({ ...prev, currency: event.target.value }))}
              />
            </FormField>
            <FormField label="Stock disponible" error={productFormErrors.stock}>
              <Input
                borderColor={productFormErrors.stock ? '#b91c1c' : undefined}
                type="number"
                placeholder="0"
                value={String(productForm.stock)}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    stock: Number(event.target.value),
                    inventory: {
                      quantity: Number(event.target.value),
                      inStock: Number(event.target.value) > 0,
                    },
                  }))
                }
              />
            </FormField>
            <FormField label="Estado">
              <Input
                placeholder="active o inactive"
                value={productForm.status}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    status: event.target.value === 'inactive' ? 'inactive' : 'active',
                  }))
                }
              />
            </FormField>
          </HStack>

          <Separator />

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text fontWeight="semibold" color="#0f172a">
                Atributos de producto
              </Text>
              <Button
                size="xs"
                variant="outline"
                borderColor="#cbd5e1"
                onClick={() =>
                  setProductForm((prev) => ({
                    ...prev,
                    attributes: [...(prev.attributes ?? []), { name: '', values: [] }],
                  }))
                }
              >
                Agregar atributo
              </Button>
            </HStack>
            {productFormErrors.attributes ? (
              <Text fontSize="xs" color="#b91c1c">{productFormErrors.attributes}</Text>
            ) : null}
            {(productForm.attributes ?? []).length === 0 ? (
              <Text fontSize="sm" color="#64748b">
                Sin atributos configurados.
              </Text>
            ) : null}
            {(productForm.attributes ?? []).map((attribute, index) => (
              <VStack key={`attribute-${index}`} align="stretch" gap={1} border={productFormErrors.attributesByIndex?.[index] ? '1px solid #fecaca' : 'none'} borderRadius="md" p={productFormErrors.attributesByIndex?.[index] ? 2 : 0}>
                <HStack align="end" gap={2}>
                <FormField label="Nombre">
                  <Input
                    borderColor={productFormErrors.attributesByIndex?.[index] ? '#b91c1c' : undefined}
                    placeholder="Ej. Material"
                    value={attribute.name}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        attributes: (prev.attributes ?? []).map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, name: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <FormField label="Valores" helper="Separa por coma.">
                  <Input
                    borderColor={productFormErrors.attributesByIndex?.[index] ? '#b91c1c' : undefined}
                    placeholder="Ej. Algodon, Poliester"
                    value={attribute.values.join(', ')}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        attributes: (prev.attributes ?? []).map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, values: parseCommaSeparatedValue(event.target.value) }
                            : entry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <Button
                  size="sm"
                  bg="#b91c1c"
                  color="white"
                  _hover={{ bg: '#991b1b' }}
                  onClick={() =>
                    setProductForm((prev) => ({
                      ...prev,
                      attributes: (prev.attributes ?? []).filter((_, entryIndex) => entryIndex !== index),
                    }))
                  }
                >
                  Quitar
                </Button>
                </HStack>
                {productFormErrors.attributesByIndex?.[index] ? (
                  <Text fontSize="xs" color="#b91c1c">{productFormErrors.attributesByIndex[index]}</Text>
                ) : null}
              </VStack>
            ))}
          </VStack>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text fontWeight="semibold" color="#0f172a">
                Precios por moneda
              </Text>
              <Button
                size="xs"
                variant="outline"
                borderColor="#cbd5e1"
                onClick={() =>
                  setProductForm((prev) => ({
                    ...prev,
                    prices: [
                      ...(prev.prices ?? []),
                      { currency: prev.currency || 'PEN', amount: prev.price || 0 },
                    ],
                  }))
                }
              >
                Agregar precio
              </Button>
            </HStack>
            {productFormErrors.prices ? (
              <Text fontSize="xs" color="#b91c1c">{productFormErrors.prices}</Text>
            ) : null}
            {(productForm.prices ?? []).length === 0 ? (
              <Text fontSize="sm" color="#64748b">
                Se usara el precio principal del formulario.
              </Text>
            ) : null}
            {(productForm.prices ?? []).map((priceEntry, index) => (
              <VStack key={`price-${index}`} align="stretch" gap={1} border={productFormErrors.pricesByIndex?.[index] ? '1px solid #fecaca' : 'none'} borderRadius="md" p={productFormErrors.pricesByIndex?.[index] ? 2 : 0}>
                <HStack align="end" gap={2}>
                <FormField label="Moneda">
                  <Input
                    borderColor={productFormErrors.pricesByIndex?.[index] ? '#b91c1c' : undefined}
                    placeholder="PEN"
                    value={priceEntry.currency}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        prices: (prev.prices ?? []).map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, currency: event.target.value.toUpperCase() } : entry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <FormField label="Monto">
                  <Input
                    borderColor={productFormErrors.pricesByIndex?.[index] ? '#b91c1c' : undefined}
                    type="number"
                    value={String(priceEntry.amount)}
                    onChange={(event) =>
                      setProductForm((prev) => {
                        const nextPrices = (prev.prices ?? []).map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, amount: parseNumberOrDefault(event.target.value) } : entry,
                        )
                        return {
                          ...prev,
                          prices: nextPrices,
                          price: index === 0 ? parseNumberOrDefault(event.target.value) : prev.price,
                        }
                      })
                    }
                  />
                </FormField>
                <FormField label="Original">
                  <Input
                    borderColor={productFormErrors.pricesByIndex?.[index] ? '#b91c1c' : undefined}
                    type="number"
                    placeholder="Opcional"
                    value={priceEntry.originalAmount === undefined ? '' : String(priceEntry.originalAmount)}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        prices: (prev.prices ?? []).map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                originalAmount:
                                  event.target.value.trim().length === 0
                                    ? undefined
                                    : parseNumberOrDefault(event.target.value),
                              }
                            : entry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <FormField label="Descuento %">
                  <Input
                    borderColor={productFormErrors.pricesByIndex?.[index] ? '#b91c1c' : undefined}
                    type="number"
                    placeholder="Opcional"
                    value={priceEntry.discountPercent === undefined ? '' : String(priceEntry.discountPercent)}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        prices: (prev.prices ?? []).map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                discountPercent:
                                  event.target.value.trim().length === 0
                                    ? undefined
                                    : parseNumberOrDefault(event.target.value),
                              }
                            : entry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <Button
                  size="sm"
                  bg="#b91c1c"
                  color="white"
                  _hover={{ bg: '#991b1b' }}
                  onClick={() =>
                    setProductForm((prev) => ({
                      ...prev,
                      prices: (prev.prices ?? []).filter((_, entryIndex) => entryIndex !== index),
                    }))
                  }
                >
                  Quitar
                </Button>
                </HStack>
                {productFormErrors.pricesByIndex?.[index] ? (
                  <Text fontSize="xs" color="#b91c1c">{productFormErrors.pricesByIndex[index]}</Text>
                ) : null}
              </VStack>
            ))}
          </VStack>

          <VStack align="stretch" gap={2}>
            <Text fontWeight="semibold" color="#0f172a">
              Inventario agregado
            </Text>
            <HStack gap={3} align="stretch" flexWrap="wrap">
              <FormField label="Cantidad total">
                <Input
                  type="number"
                  value={String(productForm.inventory?.quantity ?? productForm.stock)}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      stock: Number(event.target.value),
                      inventory: {
                        quantity: Number(event.target.value),
                        inStock: Number(event.target.value) > 0,
                      },
                    }))
                  }
                />
              </FormField>
              <FormField label="Estado de inventario">
                <HStack>
                  <Button
                    size="sm"
                    variant={productForm.inventory?.inStock ? 'solid' : 'outline'}
                    bg={productForm.inventory?.inStock ? '#0f766e' : 'white'}
                    color={productForm.inventory?.inStock ? 'white' : '#334155'}
                    onClick={() =>
                      setProductForm((prev) => ({
                        ...prev,
                        inventory: {
                          quantity: prev.inventory?.quantity ?? prev.stock,
                          inStock: true,
                        },
                      }))
                    }
                  >
                    En stock
                  </Button>
                  <Button
                    size="sm"
                    variant={productForm.inventory?.inStock === false ? 'solid' : 'outline'}
                    bg={productForm.inventory?.inStock === false ? '#334155' : 'white'}
                    color={productForm.inventory?.inStock === false ? 'white' : '#334155'}
                    onClick={() =>
                      setProductForm((prev) => ({
                        ...prev,
                        inventory: {
                          quantity: prev.inventory?.quantity ?? prev.stock,
                          inStock: false,
                        },
                      }))
                    }
                  >
                    Sin stock
                  </Button>
                </HStack>
              </FormField>
            </HStack>
          </VStack>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" color="#0f172a">
                  Disponibilidad por tienda
                </Text>
                <Text fontSize="sm" color="#64748b">
                  {(productForm.storeAvailability ?? []).length} tienda(s) configurada(s)
                </Text>
              </VStack>
              <Button size="sm" variant="outline" borderColor="#cbd5e1" onClick={() => setIsStoreAvailabilityModalOpen(true)}>
                Gestionar tiendas
              </Button>
            </HStack>
            <HStack>
              <Badge colorPalette="teal" variant="subtle">
                Disponibles: {(productForm.storeAvailability ?? []).filter((entry) => entry.available).length}
              </Badge>
              <Badge colorPalette="gray" variant="subtle">
                No disponibles: {(productForm.storeAvailability ?? []).filter((entry) => !entry.available).length}
              </Badge>
            </HStack>
            {productFormErrors.storeAvailability ? (
              <Text fontSize="xs" color="#b91c1c">{productFormErrors.storeAvailability}</Text>
            ) : null}
          </VStack>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" color="#0f172a">
                  Variantes
                </Text>
                <Text fontSize="sm" color="#64748b">
                  {(productForm.variants ?? []).length} variante(s) configurada(s)
                </Text>
              </VStack>
              <Button size="sm" variant="outline" borderColor="#cbd5e1" onClick={() => setIsVariantsModalOpen(true)}>
                Gestionar variantes
              </Button>
            </HStack>
            <HStack>
              <Badge colorPalette="purple" variant="subtle">
                Tipo: {productForm.productType === 'variable' ? 'Variable' : 'Simple'}
              </Badge>
              <Badge colorPalette="blue" variant="subtle">
                Con imagen: {(productForm.variants ?? []).filter((variant) => Boolean(variant.imageUrl)).length}
              </Badge>
            </HStack>
            {productFormErrors.variants ? (
              <Text fontSize="xs" color="#b91c1c">{productFormErrors.variants}</Text>
            ) : null}
          </VStack>

          <HStack>
            <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} loading={isSubmitting} onClick={() => void submitProduct()}>
              {productEditor.mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outline"
              borderColor="#cbd5e1"
              onClick={() => {
                setProductFormErrors({})
                setProductForm(defaultProductForm)
                setIsProductOnOffer(false)
                setIsStoreAvailabilityModalOpen(false)
                setIsVariantsModalOpen(false)
                setProductEditor({ isOpen: false, mode: 'create', productId: null })
              }}
            >
              Cancelar
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={productEditor.isOpen && isStoreAvailabilityModalOpen}
        title="Disponibilidad por tienda"
        onClose={() => setIsStoreAvailabilityModalOpen(false)}
      >
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <Text fontWeight="semibold" color="#0f172a">
              Disponibilidad por tienda
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="#cbd5e1"
              onClick={() =>
                setProductForm((prev) => ({
                  ...prev,
                  storeAvailability: [
                    ...(prev.storeAvailability ?? []),
                    { storeId: stores[0]?.id ?? '', available: true, quantity: 0 },
                  ],
                }))
              }
            >
              Agregar tienda
            </Button>
          </HStack>
          {productFormErrors.storeAvailability ? (
            <Text fontSize="xs" color="#b91c1c">{productFormErrors.storeAvailability}</Text>
          ) : null}
          {(productForm.storeAvailability ?? []).length === 0 ? (
            <Text fontSize="sm" color="#64748b">
              No hay disponibilidad por tienda definida.
            </Text>
          ) : null}
          {(productForm.storeAvailability ?? []).map((entry, index) => (
            <VStack
              key={`store-availability-${index}`}
              align="stretch"
              gap={1}
              border={productFormErrors.storeAvailabilityByIndex?.[index] ? '1px solid #fecaca' : '1px solid #e2e8f0'}
              borderRadius="md"
              p={2}
            >
              <HStack align="end" gap={2} flexWrap="wrap">
                <FormField label="Tienda">
                  <select
                    value={entry.storeId}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        storeAvailability: (prev.storeAvailability ?? []).map((storeEntry, entryIndex) =>
                          entryIndex === index ? { ...storeEntry, storeId: event.target.value } : storeEntry,
                        ),
                      }))
                    }
                    style={{ ...comboStyle, borderColor: productFormErrors.storeAvailabilityByIndex?.[index] ? '#b91c1c' : '#cbd5e1' }}
                  >
                    <option value="">Selecciona tienda</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Cantidad">
                  <Input
                    borderColor={productFormErrors.storeAvailabilityByIndex?.[index] ? '#b91c1c' : undefined}
                    type="number"
                    value={String(entry.quantity ?? 0)}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        storeAvailability: (prev.storeAvailability ?? []).map((storeEntry, entryIndex) =>
                          entryIndex === index
                            ? { ...storeEntry, quantity: parseNumberOrDefault(event.target.value) }
                            : storeEntry,
                        ),
                      }))
                    }
                  />
                </FormField>
                <FormField label="Disponible">
                  <HStack>
                    <Button
                      size="sm"
                      variant={entry.available ? 'solid' : 'outline'}
                      bg={entry.available ? '#0f766e' : 'white'}
                      color={entry.available ? 'white' : '#334155'}
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          storeAvailability: (prev.storeAvailability ?? []).map((storeEntry, entryIndex) =>
                            entryIndex === index ? { ...storeEntry, available: true } : storeEntry,
                          ),
                        }))
                      }
                    >
                      Si
                    </Button>
                    <Button
                      size="sm"
                      variant={!entry.available ? 'solid' : 'outline'}
                      bg={!entry.available ? '#334155' : 'white'}
                      color={!entry.available ? 'white' : '#334155'}
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          storeAvailability: (prev.storeAvailability ?? []).map((storeEntry, entryIndex) =>
                            entryIndex === index ? { ...storeEntry, available: false } : storeEntry,
                          ),
                        }))
                      }
                    >
                      No
                    </Button>
                  </HStack>
                </FormField>
                <Button
                  size="sm"
                  bg="#b91c1c"
                  color="white"
                  _hover={{ bg: '#991b1b' }}
                  onClick={() =>
                    setProductForm((prev) => ({
                      ...prev,
                      storeAvailability: (prev.storeAvailability ?? []).filter((_, entryIndex) => entryIndex !== index),
                    }))
                  }
                >
                  Quitar
                </Button>
              </HStack>
              {productFormErrors.storeAvailabilityByIndex?.[index] ? (
                <Text fontSize="xs" color="#b91c1c">{productFormErrors.storeAvailabilityByIndex[index]}</Text>
              ) : null}
            </VStack>
          ))}

          <HStack>
            <Button variant="outline" borderColor="#cbd5e1" onClick={() => setIsStoreAvailabilityModalOpen(false)}>
              Volver al producto
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={productEditor.isOpen && isVariantsModalOpen}
        title="Variantes del producto"
        onClose={() => setIsVariantsModalOpen(false)}
      >
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <Text fontWeight="semibold" color="#0f172a">
              Variantes
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="#cbd5e1"
              onClick={() =>
                setProductForm((prev) => ({
                  ...prev,
                  variants: [
                    ...(prev.variants ?? []),
                    {
                      id: '',
                      sku: '',
                      name: '',
                      imageUrl: '',
                      attributes: [],
                      inventory: { quantity: 0, inStock: false },
                      prices: [{ currency: prev.currency || 'PEN', amount: prev.price || 0 }],
                    },
                  ],
                }))
              }
            >
              Agregar variante
            </Button>
          </HStack>
          {productFormErrors.variants ? (
            <Text fontSize="xs" color="#b91c1c">{productFormErrors.variants}</Text>
          ) : null}
          {(productForm.variants ?? []).length === 0 ? (
            <Text fontSize="sm" color="#64748b">
              Producto sin variantes definidas.
            </Text>
          ) : null}
          {(productForm.variants ?? []).map((variant, index) => {
            const primaryVariantPrice = variant.prices?.[0]
            return (
              <Box key={`variant-${index}`} p={3} border="1px solid" borderColor={productFormErrors.variantsByIndex?.[index] ? '#fecaca' : '#e2e8f0'} borderRadius="lg">
                <VStack align="stretch" gap={2}>
                  {productFormErrors.variantsByIndex?.[index] ? (
                    <Text fontSize="xs" color="#b91c1c">{productFormErrors.variantsByIndex[index]}</Text>
                  ) : null}
                  <HStack gap={2} align="stretch" flexWrap="wrap">
                    <FormField label="ID variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        placeholder="Opcional"
                        value={variant.id ?? ''}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, id: event.target.value } : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="SKU variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        placeholder="Ej. SKU-001-BLK"
                        value={variant.sku ?? ''}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, sku: event.target.value } : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Nombre variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        placeholder="Ej. Negro XL"
                        value={variant.name ?? ''}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, name: event.target.value } : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                  </HStack>

                  <HStack gap={2} align="stretch" flexWrap="wrap">
                    <FormField label="Imagen variante (URL)">
                      <VStack align="stretch" gap={2}>
                        <Input
                          borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                          placeholder="https://..."
                          value={variant.imageUrl ?? ''}
                          onChange={(event) =>
                            setProductForm((prev) => ({
                              ...prev,
                              variants: (prev.variants ?? []).map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, imageUrl: event.target.value } : entry,
                              ),
                            }))
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            void handleVariantImageUpload(index, event.target.files)
                            event.target.value = ''
                          }}
                        />
                        {isHttpImageReference(variant.imageUrl) ? (
                          <Box border="1px solid" borderColor="#e2e8f0" borderRadius="lg" p={2} bg="#f8fafc">
                            <VStack align="stretch" gap={2}>
                              <img
                                src={variant.imageUrl}
                                alt={`Preview variante ${index + 1}`}
                                style={{
                                  width: '100%',
                                  maxHeight: '180px',
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  background: 'white',
                                }}
                              />
                              <Button
                                size="xs"
                                variant="outline"
                                borderColor="#cbd5e1"
                                onClick={() =>
                                  setProductForm((prev) => ({
                                    ...prev,
                                    variants: (prev.variants ?? []).map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, imageUrl: '' } : entry,
                                    ),
                                  }))
                                }
                              >
                                Quitar imagen de variante
                              </Button>
                            </VStack>
                          </Box>
                        ) : null}
                      </VStack>
                    </FormField>
                    <FormField label="Atributos variante" helper="Formato: Color:Negro, Size:XL">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        placeholder="Color:Negro, Size:XL"
                        value={stringifyVariantAttributes(variant.attributes ?? [])}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, attributes: parseVariantAttributes(event.target.value) }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                  </HStack>

                  <HStack gap={2} align="stretch" flexWrap="wrap">
                    <FormField label="Stock variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        type="number"
                        value={String(variant.inventory?.quantity ?? 0)}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    inventory: {
                                      quantity: parseNumberOrDefault(event.target.value),
                                      inStock: parseNumberOrDefault(event.target.value) > 0,
                                    },
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Moneda variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        value={primaryVariantPrice?.currency ?? productForm.currency}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    prices: [
                                      {
                                        currency: event.target.value.toUpperCase(),
                                        amount: entry.prices?.[0]?.amount ?? 0,
                                        originalAmount: entry.prices?.[0]?.originalAmount,
                                        discountPercent: entry.prices?.[0]?.discountPercent,
                                      },
                                    ],
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Precio variante">
                      <Input
                        borderColor={productFormErrors.variantsByIndex?.[index] ? '#b91c1c' : undefined}
                        type="number"
                        value={String(primaryVariantPrice?.amount ?? 0)}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            variants: (prev.variants ?? []).map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    prices: [
                                      {
                                        currency: entry.prices?.[0]?.currency ?? prev.currency,
                                        amount: parseNumberOrDefault(event.target.value),
                                        originalAmount: entry.prices?.[0]?.originalAmount,
                                        discountPercent: entry.prices?.[0]?.discountPercent,
                                      },
                                    ],
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </FormField>
                  </HStack>

                  <HStack justify="end">
                    <Button
                      size="sm"
                      bg="#b91c1c"
                      color="white"
                      _hover={{ bg: '#991b1b' }}
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          variants: (prev.variants ?? []).filter((_, entryIndex) => entryIndex !== index),
                        }))
                      }
                    >
                      Eliminar variante
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )
          })}

          <HStack>
            <Button variant="outline" borderColor="#cbd5e1" onClick={() => setIsVariantsModalOpen(false)}>
              Volver al producto
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={categoryEditor.isOpen}
        title={categoryEditor.mode === 'create' ? 'Agregar categoria' : 'Actualizar categoria'}
        onClose={() => setCategoryEditor({ isOpen: false, mode: 'create', categoryId: null })}
      >
        <VStack align="stretch" gap={3}>
          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Nombre de categoria">
              <Input placeholder="Ej. Camisas" value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} />
            </FormField>
            <FormField label="Slug">
              <Input
                placeholder="Ej. camisas"
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
              />
            </FormField>
          </HStack>

          <FormField label="Descripcion">
            <Input
              placeholder="Describe la categoria"
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </FormField>

          <FormField label="Estado de categoria">
          <HStack>
            <Button
              size="sm"
              variant={categoryForm.active ? 'solid' : 'outline'}
              bg={categoryForm.active ? '#0f766e' : 'white'}
              color={categoryForm.active ? 'white' : '#334155'}
              onClick={() => setCategoryForm((prev) => ({ ...prev, active: true }))}
            >
              Activa
            </Button>
            <Button
              size="sm"
              variant={!categoryForm.active ? 'solid' : 'outline'}
              bg={!categoryForm.active ? '#334155' : 'white'}
              color={!categoryForm.active ? 'white' : '#334155'}
              onClick={() => setCategoryForm((prev) => ({ ...prev, active: false }))}
            >
              Inactiva
            </Button>
          </HStack>
          </FormField>

          <HStack>
            <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} loading={isSubmitting} onClick={() => void submitCategory()}>
              {categoryEditor.mode === 'create' ? 'Crear categoria' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outline"
              borderColor="#cbd5e1"
              onClick={() => {
                setCategoryForm(defaultCategoryForm)
                setCategoryEditor({ isOpen: false, mode: 'create', categoryId: null })
              }}
            >
              Cancelar
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={storeEditor.isOpen}
        title={storeEditor.mode === 'create' ? 'Agregar tienda' : 'Actualizar tienda'}
        onClose={() => setStoreEditor({ isOpen: false, mode: 'create', storeId: null })}
      >
        <VStack align="stretch" gap={3}>
          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Nombre de tienda">
              <Input placeholder="Ej. Trini Miraflores" value={storeForm.name} onChange={(event) => setStoreForm((prev) => ({ ...prev, name: event.target.value }))} />
            </FormField>
            <FormField label="Slug">
              <Input placeholder="Ej. trini-miraflores" value={storeForm.slug} onChange={(event) => setStoreForm((prev) => ({ ...prev, slug: event.target.value }))} />
            </FormField>
          </HStack>

          <FormField label="Direccion">
            <Input
              placeholder="Av. Principal 123"
              value={storeForm.address}
              onChange={(event) => setStoreForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </FormField>

          <HStack gap={3} align="stretch" flexWrap="wrap">
            <FormField label="Distrito">
              <Input
                placeholder="Ej. Miraflores"
                value={storeForm.district}
                onChange={(event) => setStoreForm((prev) => ({ ...prev, district: event.target.value }))}
              />
            </FormField>
            <FormField label="Referencia">
              <Input
                placeholder="Frente al parque central"
                value={storeForm.reference}
                onChange={(event) => setStoreForm((prev) => ({ ...prev, reference: event.target.value }))}
              />
            </FormField>
          </HStack>

          <FormField label="Canales de entrega habilitados">
          <HStack>
            <Button
              size="sm"
              variant={storeForm.pickupEnabled ? 'solid' : 'outline'}
              bg={storeForm.pickupEnabled ? '#0f766e' : 'white'}
              color={storeForm.pickupEnabled ? 'white' : '#334155'}
              onClick={() => setStoreForm((prev) => ({ ...prev, pickupEnabled: !prev.pickupEnabled }))}
            >
              Retiro {storeForm.pickupEnabled ? 'habilitado' : 'deshabilitado'}
            </Button>
            <Button
              size="sm"
              variant={storeForm.courierEnabled ? 'solid' : 'outline'}
              bg={storeForm.courierEnabled ? '#0f172a' : 'white'}
              color={storeForm.courierEnabled ? 'white' : '#334155'}
              onClick={() => setStoreForm((prev) => ({ ...prev, courierEnabled: !prev.courierEnabled }))}
            >
              Courier {storeForm.courierEnabled ? 'habilitado' : 'deshabilitado'}
            </Button>
          </HStack>
          </FormField>

          <FormField label="Estado de tienda">
          <HStack>
            <Button
              size="sm"
              variant={storeForm.active ? 'solid' : 'outline'}
              bg={storeForm.active ? '#0f766e' : 'white'}
              color={storeForm.active ? 'white' : '#334155'}
              onClick={() => setStoreForm((prev) => ({ ...prev, active: true }))}
            >
              Activa
            </Button>
            <Button
              size="sm"
              variant={!storeForm.active ? 'solid' : 'outline'}
              bg={!storeForm.active ? '#334155' : 'white'}
              color={!storeForm.active ? 'white' : '#334155'}
              onClick={() => setStoreForm((prev) => ({ ...prev, active: false }))}
            >
              Inactiva
            </Button>
          </HStack>
          </FormField>

          <HStack>
            <Button bg="#0f766e" color="white" _hover={{ bg: '#115e59' }} loading={isSubmitting} onClick={() => void submitStore()}>
              {storeEditor.mode === 'create' ? 'Crear tienda' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outline"
              borderColor="#cbd5e1"
              onClick={() => {
                setStoreForm(defaultStoreForm)
                setStoreEditor({ isOpen: false, mode: 'create', storeId: null })
              }}
            >
              Cancelar
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={Boolean(orderDetail)}
        title={orderDetail ? `Detalle de orden ${orderDetail.id.slice(0, 8)}` : 'Detalle de orden'}
        onClose={() => setOrderDetail(null)}
      >
        {orderDetail ? (
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between" align="center">
              <Text color="#334155" fontSize="sm">
                {new Date(orderDetail.createdAt).toLocaleString('es-PE')}
              </Text>
              <Badge colorPalette={orderDetail.source === 'api' ? 'teal' : 'orange'}>
                {orderDetail.source === 'api' ? 'API ecommerce' : 'Historial local'}
              </Badge>
            </HStack>

            <Box border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={3} bg="#f8fafc">
              <HStack justify="space-between" mb={1}>
                <Text color="#334155">Items</Text>
                <Text color="#0f172a" fontWeight="semibold">{orderDetail.itemCount}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="#334155">Subtotal</Text>
                <Text color="#ea580c" fontWeight="bold" fontSize="lg">{formatCurrency(orderDetail.subtotal)}</Text>
              </HStack>
            </Box>

            <VStack align="stretch" gap={2}>
              {orderDetail.items.map((item, index) => (
                <Box key={`${orderDetail.id}-${item.productId}-${index}`} border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={3} bg="white">
                  <HStack justify="space-between" align="start" gap={3}>
                    <HStack align="start" gap={3} flex="1">
                      <Box
                        width="62px"
                        height="82px"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="blackAlpha.200"
                        bg="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                        overflow="hidden"
                        flexShrink={0}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Text fontSize="xs" color="#64748b" fontWeight="bold">TRINI</Text>
                        )}
                      </Box>
                    <VStack align="start" gap={1} flex="1">
                      <Text color="#0f172a" fontWeight="semibold">{item.productName}</Text>
                      <Badge borderRadius="md" bg="#ffedd5" color="#c2410c">
                        Ultimo dia
                      </Badge>
                      <HStack gap={2} wrap="wrap">
                        {item.selectedColor ? (
                          <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
                            Color: {item.selectedColor}
                          </Badge>
                        ) : null}
                        {item.selectedSize ? (
                          <Badge borderRadius="full" bg="#f1f5f9" color="#334155" px={2}>
                            Talla: {item.selectedSize}
                          </Badge>
                        ) : null}
                        {item.isGift ? (
                          <Badge borderRadius="full" bg="#fce7f3" color="#be185d" px={2}>
                            Regalo
                          </Badge>
                        ) : null}
                      </HStack>
                    </VStack>
                    </HStack>
                    <Text color="#64748b" fontSize="sm">x{item.quantity}</Text>
                  </HStack>
                  <HStack justify="space-between" mt={2}>
                    <Text color="#64748b" fontSize="sm">Unitario: {formatCurrency(item.unitPrice)}</Text>
                    <Text color="#ea580c" fontWeight="bold">{formatCurrency(item.unitPrice * item.quantity)}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>

            <HStack>
              <Button
                bg="#ea580c"
                color="white"
                _hover={{ bg: '#c2410c' }}
                disabled={!orderDetail.shortSharedCartUrl && !orderDetail.sharedCartUrl}
                onClick={async () => {
                  const linkToCopy = orderDetail.shortSharedCartUrl ?? orderDetail.sharedCartUrl
                  if (!linkToCopy) {
                    return
                  }

                  try {
                    await navigator.clipboard.writeText(linkToCopy)
                    openFeedback('success', 'Link copiado', 'El link de carrito compartido se copio al portapapeles.')
                  } catch {
                    openFeedback('error', 'No se pudo copiar', 'No fue posible copiar el link automaticamente.')
                  }
                }}
              >
                Copiar link carrito compartido
              </Button>
            </HStack>
          </VStack>
        ) : null}
      </ModalShell>

      <ModalShell
        isOpen={Boolean(confirmDelete?.isOpen)}
        title="Confirmar eliminacion"
        onClose={() => setConfirmDelete(null)}
      >
        <VStack align="stretch" gap={4}>
          <Text color="#334155">
            {confirmDelete?.entity === 'product'
              ? 'Vas a eliminar este producto (se marcara como inactivo).'
              : confirmDelete?.entity === 'category'
                ? 'Vas a eliminar esta categoria (se desactivara).'
                : confirmDelete?.entity === 'store'
                  ? 'Vas a eliminar esta tienda (se desactivara).'
                  : 'Vas a eliminar esta orden del listado.' }
          </Text>
          <HStack>
            <Button bg="#b91c1c" color="white" _hover={{ bg: '#991b1b' }} loading={isSubmitting} onClick={() => void handleDelete()}>
              Confirmar
            </Button>
            <Button variant="outline" borderColor="#cbd5e1" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
          </HStack>
        </VStack>
      </ModalShell>

      <ModalShell
        isOpen={feedback.isOpen}
        title={feedback.title}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
      >
        <VStack align="stretch" gap={4}>
          <Alert.Root status={feedback.tone === 'success' ? 'success' : feedback.tone === 'error' ? 'error' : 'info'} borderRadius="xl" variant="subtle">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{feedback.message}</Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <HStack>
            <Button bg="#0f172a" color="white" _hover={{ bg: '#1f2937' }} onClick={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}>
              Entendido
            </Button>
          </HStack>
        </VStack>
      </ModalShell>
    </Box>
  )
}
