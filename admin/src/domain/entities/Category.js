export class Category {
  constructor({ id, name, slug, active, parentId, imageUrl }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.active = active;
    this.parentId = parentId;
    this.imageUrl = imageUrl;
  }
}
