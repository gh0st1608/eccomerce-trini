export class ListInternalUsersUseCase {
  constructor({ internalUserRepository }) {
    this.internalUserRepository = internalUserRepository;
  }

  async execute() {
    return this.internalUserRepository.list();
  }
}
