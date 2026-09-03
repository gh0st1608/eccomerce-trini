import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../domain/exceptions/index.js';

const resolvePublicBaseUrl = (req, fallback = '') => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];

  if (forwardedProto && forwardedHost) {
    return `${String(forwardedProto).split(',')[0]}://${String(forwardedHost).split(',')[0]}`;
  }

  if (req.protocol && req.get?.('host')) {
    return `${req.protocol}://${req.get('host')}`;
  }

  return fallback;
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const createCheckoutController = ({
  buildWhatsappCheckoutUseCase,
  resolveSharedCheckoutUseCase,
  checkoutSharePublicBaseUrl = '',
}) => ({
  checkoutByWhatsapp: async (req, res, next) => {
    try {
      const result = await buildWhatsappCheckoutUseCase.execute(req.body, {
        publicBaseUrl: resolvePublicBaseUrl(req, checkoutSharePublicBaseUrl),
      });
      res.status(201).json(
        successResponse({
          data: result,
          message: 'Checkout URL generated',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
  resolveSharedCheckout: async (req, res, next) => {
    try {
      const token = req.query?.token;
      if (!token || typeof token !== 'string') {
        throw new ValidationError('Shared checkout token is required');
      }

      const sharedCheckout = resolveSharedCheckoutUseCase.execute(token);
      res.status(200).json(
        successResponse({
          data: { sharedCheckout },
          message: 'Shared checkout loaded',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
  shareCheckoutPreview: async (req, res, next) => {
    try {
      const token = req.query?.token;
      if (!token || typeof token !== 'string') {
        throw new ValidationError('Shared checkout token is required');
      }

      const baseUrl = resolvePublicBaseUrl(req, checkoutSharePublicBaseUrl).replace(/\/$/, '');
      if (!baseUrl) {
        throw new ValidationError('Public base URL is required');
      }

      const encodedToken = encodeURIComponent(token);
      const redirectUrl = `${baseUrl}/cart/shared?token=${encodedToken}`;
      const canonicalUrl = `${baseUrl}/api/v1/checkout/share?token=${encodedToken}`;
      // WhatsApp/Facebook crawlers do not render SVG for og:image, PNG is required.
      const imageUrl = `${baseUrl}/logo-mayo-collection.png`;

      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'no-store, max-age=0')
        .send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mayo Collection | Carrito compartido</title>
    <meta name="description" content="Abre el carrito compartido y continua tu compra por WhatsApp." />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Mayo Collection | Carrito compartido" />
    <meta property="og:description" content="Abre el carrito compartido y continua tu compra por WhatsApp." />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="630" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Mayo Collection" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Mayo Collection | Carrito compartido" />
    <meta name="twitter:description" content="Abre el carrito compartido y continua tu compra por WhatsApp." />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />
  </head>
  <body>
    <p>Redirigiendo al carrito compartido...</p>
    <a href="${escapeHtml(redirectUrl)}">Continuar</a>
    <script>
      window.location.replace(${JSON.stringify(redirectUrl)});
    </script>
  </body>
</html>`);
    } catch (error) {
      next(error);
    }
  },
});
