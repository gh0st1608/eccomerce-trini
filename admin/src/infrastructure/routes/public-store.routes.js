import { Router } from 'express';

// Storefront reads pickup-enabled stores using the shared public read-only token.
// ecommerce's checkout also uses the single-store lookup to validate delivery.storeId.
export const createPublicStoreRouter = ({ publicStoreController }) => {
  const router = Router();
  router.get('/stores/pickup', publicStoreController.listPickupStores);
  router.get('/stores/pickup/:id', publicStoreController.getPickupStoreById);
  return router;
};
