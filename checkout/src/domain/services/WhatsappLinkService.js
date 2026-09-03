import { WhatsappLinkServicePort } from '../../application/ports/WhatsappLinkServicePort.js';

export class WhatsappLinkService extends WhatsappLinkServicePort {
  constructor({ whatsappClient, urlShortenerClient = null }) {
    super();
    this.whatsappClient = whatsappClient;
    this.urlShortenerClient = urlShortenerClient;
  }

  async buildCheckoutLink(cart, delivery, options = {}) {
    const subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    const linkToShare = options.sharedCartUrl ?? '';
    const shortenedLink = this.urlShortenerClient && linkToShare
      ? await this.urlShortenerClient.shorten(linkToShare)
      : linkToShare;
    const shortSharedCartUrl = shortenedLink && shortenedLink !== linkToShare ? shortenedLink : null;
    const message = shortSharedCartUrl || linkToShare || shortenedLink || '';

    return {
      checkoutUrl: this.whatsappClient.buildLink(message),
      sharedCartUrl: options.sharedCartUrl ?? null,
      shortSharedCartUrl,
      subtotal,
      itemCount: cart.items.length,
    };
  }
}
