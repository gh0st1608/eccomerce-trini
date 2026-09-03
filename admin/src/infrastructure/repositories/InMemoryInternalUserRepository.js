import { randomUUID } from 'node:crypto';
import { InternalUser } from '../../domain/entities/InternalUser.js';
import { InternalUserRepositoryPort } from '../../application/ports/InternalUserRepositoryPort.js';

export const records = [
  {
    id: 'usr-001',
    name: 'Admin Principal',
    email: 'admin@trini.local',
    role: 'admin',
    active: true,
  },
];

export class InMemoryInternalUserRepository extends InternalUserRepositoryPort {
  async list() {
    return records.map((entry) => new InternalUser(entry));
  }

  async create(user) {
    const newRecord = {
      id: randomUUID(),
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    };
    records.push(newRecord);
    return new InternalUser(newRecord);
  }
}
