import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ProductImageStoragePort } from '../../application/ports/ProductImageStoragePort.js';
import { BusinessError, InternalServerError } from '../../domain/exceptions/index.js';

const DATA_URL_IMAGE_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

const sanitizeSegment = (value, fallback) => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.length > 0 ? normalized : fallback;
};

const encodeObjectKey = (key) =>
  key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export class S3ProductImageStorageClient extends ProductImageStoragePort {
  constructor({
    bucketName,
    region,
    endpoint,
    forcePathStyle = false,
    publicBaseUrl,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  }) {
    super();
    this.bucketName = bucketName;
    this.region = region;
    this.endpoint = endpoint;
    this.forcePathStyle = forcePathStyle;
    this.publicBaseUrl = publicBaseUrl;

    const hasStaticCredentials =
      Boolean(accessKeyId)
      && Boolean(secretAccessKey);

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials: hasStaticCredentials
        ? {
            accessKeyId,
            secretAccessKey,
            sessionToken: sessionToken || undefined,
          }
        : undefined,
    });
  }

  async uploadDataUrl({ dataUrl, keyPrefix = 'products', fileNameHint = 'image' }) {
    const parsed = DATA_URL_IMAGE_REGEX.exec(String(dataUrl ?? '').trim());

    if (!parsed) {
      throw new BusinessError('Invalid image payload. Expected base64 data URL.');
    }

    const mimeType = parsed[1].toLowerCase();
    const base64Body = parsed[2].replace(/\s+/g, '');
    const extension = MIME_EXTENSION_MAP[mimeType];

    if (!extension) {
      throw new BusinessError(`Unsupported image mime type: ${mimeType}`);
    }

    const objectKey = `${keyPrefix.replace(/\/$/, '')}/${Date.now()}-${randomUUID()}-${sanitizeSegment(fileNameHint, 'image')}.${extension}`;
    const encodedKey = encodeObjectKey(objectKey);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: Buffer.from(base64Body, 'base64'),
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch {
      throw new InternalServerError('Unable to upload image to S3');
    }

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
    }

    if (this.endpoint && this.forcePathStyle) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${encodedKey}`;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodedKey}`;
  }
}