import { randomUUID } from 'node:crypto';
import { Store } from '../../domain/entities/Store.js';
import { StoreRepositoryPort } from '../../application/ports/StoreRepositoryPort.js';

export const records = [
  {
    id: 'store-001',
    name: 'Trini Miraflores',
    slug: 'trini-miraflores',
    address: 'Av. Larco 512',
    district: 'Miraflores',
    reference: 'Frente al parque central',
    pickupEnabled: true,
    courierEnabled: true,
    active: true,
  },
  {
    id: 'store-002',
    name: 'Trini San Isidro',
    slug: 'trini-san-isidro',
    address: 'Av. Conquistadores 355',
    district: 'San Isidro',
    reference: 'A media cuadra del ovalo',
    pickupEnabled: true,
    courierEnabled: false,
    active: true,
  },
];

export class InMemoryStoreRepository extends StoreRepositoryPort {
  async list() {
    return records.map((entry) => new Store(entry));
  }

  async listPickupAvailable() {
    return records
      .filter((entry) => entry.active && entry.pickupEnabled)
      .map((entry) => new Store(entry));
  }

  async findById(id) {
    const store = records.find((entry) => entry.id === id);
    return store ? new Store(store) : null;
  }

  async findBySlug(slug) {
    const store = records.find((entry) => entry.slug === slug);
    return store ? new Store(store) : null;
  }

  async create(store) {
    const newRecord = {
      id: randomUUID(),
      name: store.name,
      slug: store.slug,
      address: store.address,
      district: store.district,
      reference: store.reference,
      pickupEnabled: store.pickupEnabled,
      courierEnabled: store.courierEnabled,
      active: store.active,
    };

    records.push(newRecord);
    return new Store(newRecord);
  }

  async update(id, store) {
    const index = records.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return null;
    }

    const updatedRecord = {
      ...records[index],
      name: store.name,
      slug: store.slug,
      address: store.address,
      district: store.district,
      reference: store.reference,
      pickupEnabled: store.pickupEnabled,
      courierEnabled: store.courierEnabled,
      active: store.active,
    };

    records[index] = updatedRecord;
    return new Store(updatedRecord);
  }
}
