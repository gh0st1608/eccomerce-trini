import { randomUUID } from 'node:crypto';
import { Category } from '../../domain/entities/Category.js';
import { CategoryRepositoryPort } from '../../application/ports/CategoryRepositoryPort.js';

export const CATEGORIES = [
  {
    id: 'cat-001',
    name: 'Electronica',
    slug: 'electronica',
    description: 'Dispositivos y tecnologia para uso diario.',
    active: true,
  },
  {
    id: 'cat-002',
    name: 'Hogar',
    slug: 'hogar',
    description: 'Productos para casa, oficina y organizacion.',
    active: true,
  },
  {
    id: 'cat-003',
    name: 'Deportes',
    slug: 'deportes',
    description: 'Accesorios y equipamiento para actividad fisica.',
    active: true,
  },
];

export class InMemoryCategoryRepository extends CategoryRepositoryPort {
  async list() {
    return CATEGORIES.map((entry) => new Category(entry));
  }

  async findById(id) {
    const category = CATEGORIES.find((entry) => entry.id === id);
    return category ? new Category(category) : null;
  }

  async findBySlug(slug) {
    const normalizedSlug = slug.trim().toLowerCase();
    const category = CATEGORIES.find((entry) => entry.slug.toLowerCase() === normalizedSlug);
    return category ? new Category(category) : null;
  }

  async create(category) {
    const newCategory = {
      id: randomUUID(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
    };

    CATEGORIES.push(newCategory);
    return new Category(newCategory);
  }

  async update(id, category) {
    const index = CATEGORIES.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return null;
    }

    const updatedCategory = {
      ...CATEGORIES[index],
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
    };

    CATEGORIES[index] = updatedCategory;
    return new Category(updatedCategory);
  }
}
