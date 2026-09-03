export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string
  active: boolean
}

export interface CreateAdminCategoryInput {
  name: string
  slug: string
  description: string
  active: boolean
}

export interface UpdateAdminCategoryInput extends CreateAdminCategoryInput {
  id: string
}
