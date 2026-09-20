export class UpdateStorefrontSettingsUseCase {
  constructor({ storefrontSettingsRepository }) {
    this.storefrontSettingsRepository = storefrontSettingsRepository;
  }

  async execute(settings) {
    return this.storefrontSettingsRepository.update(settings);
  }
}