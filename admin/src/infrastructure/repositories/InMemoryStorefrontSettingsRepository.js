import { StorefrontSettingsRepositoryPort } from '../../application/ports/StorefrontSettingsRepositoryPort.js';
import { StorefrontSettings } from '../../domain/entities/StorefrontSettings.js';

let settings = new StorefrontSettings();

export class InMemoryStorefrontSettingsRepository extends StorefrontSettingsRepositoryPort {
  async get() {
    return new StorefrontSettings(settings);
  }

  async update(nextSettings) {
    settings = new StorefrontSettings(nextSettings);
    return new StorefrontSettings(settings);
  }
}