import { BusinessError } from '../../domain/exceptions/index.js';

const ALLOWED_ROLES = new Set(['admin', 'operator', 'support']);

export class CreateInternalUserUseCase {
  constructor({ internalUserRepository }) {
    this.internalUserRepository = internalUserRepository;
  }

  async execute(payload) {
    if (!ALLOWED_ROLES.has(payload.role)) {
      throw new BusinessError('Invalid internal role');
    }

    return this.internalUserRepository.create(payload);
  }
}
