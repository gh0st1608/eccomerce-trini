// Shared, pure business rules for the product catalog. Extracted so both the
// in-memory test double and the real DynamoDB-backed repository apply the
// exact same normalization/filtering/sorting/featured-ranking logic.

export const DEFAULT_CURRENCY = 'PEN';
export const DEFAULT_COLORS = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige'];
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];
export const FEATURED_PRODUCTS_LIMIT = 6;

const toUniqueStrings = (values = []) =>
  [...new Set(values.map((value) => String(value).trim()).filter((value) => value.length > 0))];

const extractValuesFromAttributes = (attributes = [], names = []) => {
  const normalizedNames = names.map((name) => name.toLowerCase());

  return attributes
    .filter((attribute) => normalizedNames.includes(String(attribute?.name ?? '').toLowerCase()))
    .flatMap((attribute) => (Array.isArray(attribute?.values) ? attribute.values : []));
};

const extractValuesFromVariantAttributes = (variants = [], names = []) => {
  const normalizedNames = names.map((name) => name.toLowerCase());

  return variants
    .flatMap((variant) => (Array.isArray(variant?.attributes) ? variant.attributes : []))
    .filter((attribute) => normalizedNames.includes(String(attribute?.name ?? '').toLowerCase()))
    .map((attribute) => attribute?.value)
    .filter((value) => typeof value === 'string' && value.trim().length > 0);
};

export const normalizeProductRecord = (record) => {
  const normalizedImages =
    Array.isArray(record.images) && record.images.length > 0
      ? toUniqueStrings(record.images)
      : record.imageUrl
        ? [record.imageUrl]
        : [];

  const normalizedCategories = toUniqueStrings(
    Array.isArray(record.categories) && record.categories.length > 0
      ? record.categories
      : record.category
        ? [record.category]
        : [],
  );

  const normalizedVariants = Array.isArray(record.variants) ? record.variants : [];
  const existingAttributes = Array.isArray(record.attributes) ? [...record.attributes] : [];

  const derivedColorValues = toUniqueStrings([
    ...(Array.isArray(record.colors) ? record.colors : []),
    ...extractValuesFromAttributes(existingAttributes, ['color']),
    ...extractValuesFromVariantAttributes(normalizedVariants, ['color']),
  ]);

  const derivedSizeValues = toUniqueStrings([
    ...(Array.isArray(record.sizes) ? record.sizes : []),
    ...extractValuesFromAttributes(existingAttributes, ['size', 'talla']),
    ...extractValuesFromVariantAttributes(normalizedVariants, ['size', 'talla']),
  ]);

  if (
    derivedColorValues.length > 0
    && !existingAttributes.some((attribute) => String(attribute?.name ?? '').toLowerCase() === 'color')
  ) {
    existingAttributes.push({ name: 'Color', values: derivedColorValues });
  }

  if (
    derivedSizeValues.length > 0
    && !existingAttributes.some((attribute) => ['size', 'talla'].includes(String(attribute?.name ?? '').toLowerCase()))
  ) {
    existingAttributes.push({ name: 'Size', values: derivedSizeValues });
  }

  const normalizedPrices =
    Array.isArray(record.prices) && record.prices.length > 0
      ? record.prices
      : [
          {
            currency: record.currency ?? DEFAULT_CURRENCY,
            amount: record.price,
            originalAmount: record.originalPrice,
            discountPercent: record.discountPercent,
          },
        ].filter((entry) => typeof entry.amount === 'number' && Number.isFinite(entry.amount));

  const primaryPrice = normalizedPrices[0] ?? null;
  const normalizedInventory = record.inventory ?? {
    quantity: typeof record.stock === 'number' ? record.stock : 0,
    inStock: typeof record.stock === 'number' ? record.stock > 0 : true,
  };

  return {
    ...record,
    category: record.category ?? normalizedCategories[0] ?? 'general',
    categories: normalizedCategories,
    imageUrl: record.imageUrl ?? normalizedImages[0] ?? '',
    images: normalizedImages,
    productType: record.productType ?? (normalizedVariants.length > 0 ? 'variable' : 'simple'),
    attributes: existingAttributes,
    variants: normalizedVariants,
    prices: normalizedPrices,
    inventory: normalizedInventory,
    storeAvailability: Array.isArray(record.storeAvailability) ? record.storeAvailability : [],
    colors: derivedColorValues,
    sizes: derivedSizeValues,
    price: typeof record.price === 'number' ? record.price : (primaryPrice?.amount ?? 0),
    originalPrice:
      typeof record.originalPrice === 'number'
        ? record.originalPrice
        : (primaryPrice?.originalAmount ?? undefined),
    discountPercent:
      typeof record.discountPercent === 'number'
        ? record.discountPercent
        : (primaryPrice?.discountPercent ?? undefined),
    currency: record.currency ?? primaryPrice?.currency ?? DEFAULT_CURRENCY,
    stock: typeof record.stock === 'number' ? record.stock : normalizedInventory.quantity,
    featured: Boolean(record.featured),
    status: record.status ?? 'active',
  };
};

// products here are already normalized records (not domain entities).
export const computeFeaturedProductIds = (products, checkoutFrequencyByProductId = new Map()) => {
  const rankedByCheckout = [...checkoutFrequencyByProductId.entries()]
    .filter(([, frequency]) => frequency > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([productId]) => productId)
    .slice(0, FEATURED_PRODUCTS_LIMIT);

  if (rankedByCheckout.length > 0) {
    return new Set(rankedByCheckout);
  }

  return new Set(products.filter((product) => product.featured).map((product) => product.id));
};

export const enrichProduct = (product, featuredProductIds, checkoutFrequencyByProductId = new Map()) => ({
  ...normalizeProductRecord(product),
  featured: featuredProductIds.has(product.id),
  checkoutFrequency: checkoutFrequencyByProductId.get(product.id) ?? 0,
});

export const applyFilters = (products, filters = {}) => {
  const normalizedCategory = filters.category?.trim().toLowerCase();

  return products
    .filter((product) => {
      if (!filters.status) {
        return true;
      }

      return product.status === filters.status;
    })
    .filter((product) => {
      if (!normalizedCategory) {
        return true;
      }

      return (product.categories ?? []).some(
        (category) => String(category).toLowerCase() === normalizedCategory,
      );
    })
    .filter((product) => {
      if (typeof filters.maxPrice !== 'number') {
        return true;
      }

      return product.price <= filters.maxPrice;
    })
    .filter((product) => {
      if (typeof filters.featured !== 'boolean') {
        return true;
      }

      return product.featured === filters.featured;
    });
};

export const sortProducts = (products) =>
  [...products].sort((a, b) => {
    if (b.checkoutFrequency !== a.checkoutFrequency) {
      return b.checkoutFrequency - a.checkoutFrequency;
    }

    if (Number(b.featured) !== Number(a.featured)) {
      return Number(b.featured) - Number(a.featured);
    }

    return a.name.localeCompare(b.name);
  });

export const buildOptionCatalog = (normalizedProducts) => {
  const colorSet = new Set(DEFAULT_COLORS);
  const sizeSet = new Set(DEFAULT_SIZES);
  const productTypeSet = new Set();
  const attributeNameSet = new Set();

  normalizedProducts.forEach((record) => {
    (record.colors ?? []).forEach((color) => colorSet.add(color));
    (record.sizes ?? []).forEach((size) => sizeSet.add(size));
    if (record.productType) {
      productTypeSet.add(record.productType);
    }

    (record.attributes ?? []).forEach((attribute) => {
      if (attribute?.name) {
        attributeNameSet.add(attribute.name);
      }
    });
  });

  return {
    colors: [...colorSet],
    sizes: [...sizeSet],
    productTypes: [...productTypeSet],
    attributeNames: [...attributeNameSet],
  };
};
