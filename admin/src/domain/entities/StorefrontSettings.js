export const DEFAULT_STOREFRONT_SETTINGS = {
  catalogOptions: {
    colors: ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'],
  },
  promoBanner: {
    enabled: true,
    eyebrow: 'OFERTA DE TEMPORADA',
    title: 'Hasta 30% OFF en prendas seleccionadas',
    content: 'Encuentra tus favoritos de Mayo Collection con precios especiales por tiempo limitado.',
    imageUrl: '',
    ctaLabel: 'Ver ofertas',
  },
};

export class StorefrontSettings {
  constructor(settings = {}) {
    this.catalogOptions = {
      ...DEFAULT_STOREFRONT_SETTINGS.catalogOptions,
      ...settings.catalogOptions,
    };
    this.promoBanner = {
      ...DEFAULT_STOREFRONT_SETTINGS.promoBanner,
      ...settings.promoBanner,
    };
  }
}