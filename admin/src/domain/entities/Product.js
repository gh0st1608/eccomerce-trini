export class Product {
  constructor({
    id,
    name,
    sku,
    variantGroup,
    description,
    category,
    categories,
    imageUrl,
    images,
    colors,
    sizes,
    productType,
    attributes,
    variants,
    inventory,
    prices,
    storeAvailability,
    price,
    originalPrice,
    discountPercent,
    currency,
    stock,
    featured,
    status,
  }) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.variantGroup = variantGroup;
    this.description = description;
    this.category = category;
    this.categories = categories;
    this.imageUrl = imageUrl;
    this.images = images;
    this.colors = colors;
    this.sizes = sizes;
    this.productType = productType;
    this.attributes = attributes;
    this.variants = variants;
    this.inventory = inventory;
    this.prices = prices;
    this.storeAvailability = storeAvailability;
    this.price = price;
    this.originalPrice = originalPrice;
    this.discountPercent = discountPercent;
    this.currency = currency;
    this.stock = stock;
    this.featured = featured;
    this.status = status;
  }
}
