const sanitizeSegment = (value, fallback) => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
};

export const prepareCategoryImageForStorage = async ({ payload, productImageStorage }) => {
  const imageUrl = String(payload.imageUrl ?? '').trim();
  if (!imageUrl.startsWith('data:image/') || !productImageStorage?.uploadDataUrl) {
    return { ...payload, imageUrl: imageUrl || undefined };
  }

  return {
    ...payload,
    imageUrl: await productImageStorage.uploadDataUrl({
      dataUrl: imageUrl,
      keyPrefix: `categories/${sanitizeSegment(payload.slug, 'category')}`,
      fileNameHint: 'cover',
    }),
  };
};
