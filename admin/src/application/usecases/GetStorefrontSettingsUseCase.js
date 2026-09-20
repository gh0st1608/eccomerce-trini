export class GetStorefrontSettingsUseCase {
  constructor({ storefrontSettingsRepository }) {
    this.storefrontSettingsRepository = storefrontSettingsRepository;
  }

  async execute() {
    return this.storefrontSettingsRepository.get();
  }
}