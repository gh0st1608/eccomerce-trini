const sanitizeSegment = (value, fallback) => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.length > 0 ? normalized : fallback;
};

const buildProductImageKeyPrefix = (payload, productId) => {
  const idSegment = sanitizeSegment(productId, 'unassigned');
  const skuSegment = sanitizeSegment(payload.sku, 'no-sku');
  const nameSegment = sanitizeSegment(payload.name, 'product');
  return `products/${idSegment}/${skuSegment}-${nameSegment}`;
};

const resolveImageReference = async ({ imageReference, fileNameHint, keyPrefix, productImageStorage }) => {
  if (typeof imageReference !== 'string') {
    return imageReference;
  }

  const trimmed = imageReference.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  return productImageStorage.uploadDataUrl({
    dataUrl: trimmed,
    keyPrefix,
    fileNameHint,
  });
};

const prepareColorOptions = ({ colorOptions = [], keyPrefix, productImageStorage }) =>
  Promise.all(
    colorOptions.map(async (colorOption, colorIndex) => ({
      ...colorOption,
      images: await Promise.all(
        colorOption.images.map((imageReference, imageIndex) =>
          resolveImageReference({
            imageReference,
            fileNameHint: `color-${colorIndex + 1}-${sanitizeSegment(colorOption.name, 'color')}-${imageIndex + 1}`,
            keyPrefix,
            productImageStorage,
          })),
      ),
    })),
  );

export const prepareProductImagesForStorage = async ({ payload, productId, productImageStorage }) => {
  if (!productImageStorage || typeof productImageStorage.uploadDataUrl !== 'function') {
    return payload;
  }

  const keyPrefix = buildProductImageKeyPrefix(payload, productId);

  const imageUrl = await resolveImageReference({
    imageReference: payload.imageUrl,
    fileNameHint: 'main-image',
    keyPrefix,
    productImageStorage,
  });

  const images = await Promise.all(
    (payload.images ?? []).map((imageReference, index) =>
      resolveImageReference({
        imageReference,
        fileNameHint: `gallery-${index + 1}`,
        keyPrefix,
        productImageStorage,
      })),
  );

  const colorOptions = await prepareColorOptions({
    colorOptions: payload.colorOptions,
    keyPrefix,
    productImageStorage,
  });

  const variants = await Promise.all(
    (payload.variants ?? []).map(async (variant, index) => ({
      ...variant,
      imageUrl: await resolveImageReference({
        imageReference: variant.imageUrl,
        fileNameHint: `variant-${index + 1}-${variant.sku ?? 'sku'}`,
        keyPrefix,
        productImageStorage,
      }),
    })),
  );

  return {
    ...payload,
    imageUrl,
    images,
    colorOptions,
    variants,
  };
};