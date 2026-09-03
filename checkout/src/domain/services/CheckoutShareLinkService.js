import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { ValidationError } from '../exceptions/index.js';

const base64UrlEncode = (value) => Buffer.from(value, 'utf8').toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');
const compressToBase64Url = (value) => zlib.deflateRawSync(Buffer.from(value, 'utf8')).toString('base64url');
const decompressFromBase64Url = (value) => zlib.inflateRawSync(Buffer.from(value, 'base64url')).toString('utf8');
const optionalValue = (value) => (value === null || value === undefined ? undefined : value);
const CHECKOUT_SHARE_PREVIEW_PATH = '/api/v1/checkout/share';

const buildPublicBaseUrl = (value) => String(value ?? '').trim().replace(/\/$/, '');

export class CheckoutShareLinkService {
  constructor({ secret, fallbackPublicBaseUrl = '' }) {
    this.secret = secret;
    this.fallbackPublicBaseUrl = fallbackPublicBaseUrl;
  }

  buildToken(cart, delivery) {
    if (!cart?.items?.length) {
      throw new ValidationError('Cart cannot be empty');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);

    const compactPayload = {
      v: 2,
      t: Date.now(),
      c: {
        n: cart.items.length,
        s: subtotal,
        i: cart.items.map((item) => ([
          item.productId,
          item.productName,
          item.imageUrl,
          item.category,
          item.quantity,
          item.unitPrice,
          item.originalPrice,
          item.discountPercent,
          item.total,
          item.color,
          item.size,
          item.isGift === true,
        ])),
      },
      d: [
        delivery?.method,
        delivery?.storeId,
        delivery?.storeName,
        delivery?.storeAddress,
        delivery?.storeDistrict,
      ],
    };

    const encodedPayload = compressToBase64Url(JSON.stringify(compactPayload));
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');

    return `v2.${encodedPayload}.${signature}`;
  }

  buildUrl(cart, delivery, publicBaseUrl) {
    const token = this.buildToken(cart, delivery);
    const baseUrl = buildPublicBaseUrl(publicBaseUrl || this.fallbackPublicBaseUrl);

    if (!baseUrl) {
      throw new ValidationError('Public base URL is required to build shared checkout link');
    }

    return `${baseUrl}${CHECKOUT_SHARE_PREVIEW_PATH}?token=${encodeURIComponent(token)}`;
  }

  resolveToken(token) {
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new ValidationError('Shared checkout token is required');
    }

    const parts = token.trim().split('.');
    const isCompactV2 = parts.length === 3 && parts[0] === 'v2';
    const encodedPayload = isCompactV2 ? parts[1] : parts[0];
    const signature = isCompactV2 ? parts[2] : parts[1];

    if (!encodedPayload || !signature) {
      throw new ValidationError('Invalid shared checkout token');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length
      || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new ValidationError('Invalid shared checkout token signature');
    }

    let payload;
    try {
      if (isCompactV2) {
        const compact = JSON.parse(decompressFromBase64Url(encodedPayload));

        payload = {
          version: 2,
          createdAt: new Date(Number(compact?.t || Date.now())).toISOString(),
          checkout: {
            itemCount: Number(compact?.c?.n || 0),
            subtotal: Number(compact?.c?.s || 0),
            items: Array.isArray(compact?.c?.i)
              ? compact.c.i.map((entry) => ({
                productId: entry?.[0],
                productName: entry?.[1],
                imageUrl: optionalValue(entry?.[2]),
                category: optionalValue(entry?.[3]),
                quantity: entry?.[4],
                unitPrice: entry?.[5],
                originalPrice: optionalValue(entry?.[6]),
                discountPercent: optionalValue(entry?.[7]),
                total: entry?.[8],
                color: optionalValue(entry?.[9]),
                size: optionalValue(entry?.[10]),
                isGift: entry?.[11] === true,
              }))
              : [],
          },
          delivery: {
            method: compact?.d?.[0],
            storeId: optionalValue(compact?.d?.[1]),
            storeName: optionalValue(compact?.d?.[2]),
            storeAddress: optionalValue(compact?.d?.[3]),
            storeDistrict: optionalValue(compact?.d?.[4]),
          },
        };
      } else {
        payload = JSON.parse(base64UrlDecode(encodedPayload));
      }
    } catch {
      throw new ValidationError('Invalid shared checkout token payload');
    }

    if (!payload?.checkout?.items || !Array.isArray(payload.checkout.items)) {
      throw new ValidationError('Invalid shared checkout payload');
    }

    return payload;
  }
}
