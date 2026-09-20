export class OrderRepositoryPort {
  async list() {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async create(_order) {
    throw new Error('Not implemented');
  }

  async update(_id, _changes) {
    throw new Error('Not implemented');
  }

  async delete(_id) {
    throw new Error('Not implemented');
  }
}