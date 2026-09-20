export class Order {
  constructor({
    id,
    createdAt,
    updatedAt,
    checkoutUrl,
    sharedCartUrl,
    shortSharedCartUrl,
    status = 'active',
    paymentStatus = 'pending',
    customerPhone,
    referenceFirstName,
    referenceLastName,
    itemCount,
    subtotal,
    source = 'api',
    delivery,
    items = [],
  }) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.checkoutUrl = checkoutUrl;
    this.sharedCartUrl = sharedCartUrl;
    this.shortSharedCartUrl = shortSharedCartUrl;
    this.status = status;
    this.paymentStatus = paymentStatus;
    this.customerPhone = customerPhone;
    this.referenceFirstName = referenceFirstName;
    this.referenceLastName = referenceLastName;
    this.itemCount = itemCount;
    this.subtotal = subtotal;
    this.source = source;
    this.delivery = delivery;
    this.items = items;
  }
}