export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string
  active: boolean
  parentId?: string
  imageUrl?: string
}

export interface CreateAdminCategoryInput {
  name: string
  slug: string
  description: string
  active: boolean
  parentId?: string
  imageUrl?: string
}

export interface UpdateAdminCategoryInput extends CreateAdminCategoryInput {
  id: string
}
