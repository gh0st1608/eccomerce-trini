export class Store {
  constructor({ id, name, address, district, pickupEnabled, active }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.district = district;
    this.pickupEnabled = pickupEnabled;
    this.active = active;
  }
}
