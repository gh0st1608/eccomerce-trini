import { WhatsappLinkServicePort } from '../../application/ports/WhatsappLinkServicePort.js';

function buildCustomerName(customer = {}) {
  return [
    customer.firstName,
    customer.paternalLastName || customer.lastName,
    customer.maternalLastName,
  ].filter(Boolean).join(' ');
}

function buildWhatsappMessage(customer = {}, delivery = {}, link = '') {
  const customerName = buildCustomerName(customer);
  const deliveryLabel = delivery.method === 'pickup' ? 'Tienda' : 'Courier';

  return [
    customerName ? `Nombre: ${customerName}` : null,
    customer.phone ? `Celular: ${customer.phone}` : null,
    `Entrega: ${deliveryLabel}`,
    link ? `Carrito: ${link}` : null,
  ].filter(Boolean).join('\n');
}

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
    const messageLink = shortSharedCartUrl || linkToShare || shortenedLink || '';
    const message = buildWhatsappMessage(options.customer, delivery, messageLink);

    return {
      checkoutUrl: this.whatsappClient.buildLink(message),
      sharedCartUrl: options.sharedCartUrl ?? null,
      shortSharedCartUrl,
      subtotal,
      itemCount: cart.items.length,
    };
  }
}
