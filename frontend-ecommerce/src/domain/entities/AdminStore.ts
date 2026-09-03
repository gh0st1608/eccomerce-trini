export interface AdminStore {
  id: string
  name: string
  slug: string
  address: string
  district: string
  reference: string
  pickupEnabled: boolean
  courierEnabled: boolean
  active: boolean
}

export interface CreateAdminStoreInput {
  name: string
  slug: string
  address: string
  district: string
  reference: string
  pickupEnabled: boolean
  courierEnabled: boolean
  active: boolean
}

export interface UpdateAdminStoreInput extends CreateAdminStoreInput {
  id: string
}
