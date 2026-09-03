import { NotFoundError, ValidationError } from '../../domain/exceptions/index.js';
import { Cart } from '../../domain/entities/Cart.js';

export class BuildWhatsappCheckoutUseCase {
  constructor({
    productRepository,
    storeRepository,
    whatsappLinkService,
    checkoutShareLinkService = null,
  }) {
    this.productRepository = productRepository;
    this.storeRepository = storeRepository;
    this.whatsappLinkService = whatsappLinkService;
    this.checkoutShareLinkService = checkoutShareLinkService;
  }

  async execute(payload, options = {}) {
    if (!payload?.items?.length) {
      throw new ValidationError('Cart cannot be empty');
    }

    this.validateCustomer(payload.customer);
    this.validateGiftDelivery(payload.items, payload.delivery);

    const enrichedItems = [];
    for (const item of payload.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }

      enrichedItems.push({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        category: product.category,
        quantity: item.quantity,
        unitPrice: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        total: product.price * item.quantity,
        color: item.color,
        size: item.size,
        isGift: item.isGift === true,
      });
    }

    const deliveryDetails = await this.resolveDelivery(payload.delivery);
    const cart = new Cart({ items: enrichedItems });

    const sharedCartUrl = this.checkoutShareLinkService
      ? this.checkoutShareLinkService.buildUrl(cart, deliveryDetails, options.publicBaseUrl)
      : null;

    const result = await this.whatsappLinkService.buildCheckoutLink(cart, deliveryDetails, {
      sharedCartUrl,
    });

    await this.productRepository.registerCheckoutItems(
      enrichedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    );

    return {
      ...result,
      sharedCartUrl,
    };
  }

  validateCustomer(customer) {
    const phone = typeof customer?.phone === 'string' ? customer.phone.trim() : '';
    const firstName = typeof customer?.firstName === 'string' ? customer.firstName.trim() : '';
    const lastName = typeof customer?.lastName === 'string' ? customer.lastName.trim() : '';

    if (!phone || !firstName || !lastName) {
      throw new ValidationError('Customer phone, first name and last name are required');
    }
  }

  validateGiftDelivery(items, delivery) {
    const hasGiftItems = items.some((item) => item.isGift === true);

    if (hasGiftItems && delivery?.method !== 'pickup') {
      throw new ValidationError('Gift items must use pickup delivery');
    }
  }

  async resolveDelivery(delivery) {
    if (!delivery?.method) {
      throw new ValidationError('Delivery method is required');
    }

    if (delivery.method === 'courier') {
      return {
        method: 'courier',
      };
    }

    const store = await this.storeRepository.findById(delivery.storeId);
    if (!store || !store.active || !store.pickupEnabled) {
      throw new ValidationError('Pickup store is not available');
    }

    return {
      method: 'pickup',
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      storeDistrict: store.district,
    };
  }
}
