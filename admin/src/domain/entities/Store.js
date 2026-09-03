export class Store {
  constructor({
    id,
    name,
    slug,
    address,
    district,
    reference,
    pickupEnabled,
    courierEnabled,
    active,
  }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.address = address;
    this.district = district;
    this.reference = reference;
    this.pickupEnabled = pickupEnabled;
    this.courierEnabled = courierEnabled;
    this.active = active;
  }
}
