export class Category {
  constructor({ id, name, slug, description, active, parentId, imageUrl }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.active = active;
    this.parentId = parentId;
    this.imageUrl = imageUrl;
  }
}
