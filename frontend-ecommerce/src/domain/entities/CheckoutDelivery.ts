export type CheckoutDelivery =
  | {
      method: 'courier'
    }
  | {
      method: 'pickup'
      storeId: string
    }
