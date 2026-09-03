import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'
import type {
  AdminCategory,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput,
} from '@domain/entities/AdminCategory'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  adminCategoryDtoSchema,
  adminCategoryListResponseSchema,
  adminCategorySingleResponseSchema,
  type AdminCategoryDto,
  type AdminCategoryListResponse,
  type AdminCategorySingleResponse,
} from '@infrastructure/dto/AdminCategoryDto'

function mapCategoryDtoToDomain(dto: AdminCategoryDto): AdminCategory {
  const parsed = adminCategoryDtoSchema.parse(dto)

  return {
    id: parsed.id,
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    active: parsed.active,
  }
}

function mapCategoryListResponse(response: AdminCategoryListResponse): AdminCategory[] {
  const parsed = adminCategoryListResponseSchema.parse(response)

  if (Array.isArray(parsed)) {
    return parsed.map(mapCategoryDtoToDomain)
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map(mapCategoryDtoToDomain)
  }

  return parsed.data.categories.map(mapCategoryDtoToDomain)
}

function mapSingleCategoryResponse(response: AdminCategorySingleResponse): AdminCategory {
  const parsed = adminCategorySingleResponseSchema.parse(response)

  if ('id' in parsed) {
    return mapCategoryDtoToDomain(parsed)
  }

  if ('id' in parsed.data) {
    return mapCategoryDtoToDomain(parsed.data)
  }

  return mapCategoryDtoToDomain(parsed.data.category)
}

export class HttpAdminCategoryRepository implements AdminCategoryRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async list(): Promise<AdminCategory[]> {
    const response = await this.httpClient.get<AdminCategoryListResponse>('/categories')
    return mapCategoryListResponse(response)
  }

  async create(payload: CreateAdminCategoryInput): Promise<AdminCategory> {
    const response = await this.httpClient.post<AdminCategorySingleResponse, CreateAdminCategoryInput>(
      '/categories',
      payload,
    )

    return mapSingleCategoryResponse(response)
  }

  async update(payload: UpdateAdminCategoryInput): Promise<AdminCategory> {
    const { id, ...body } = payload

    const response = await this.httpClient.put<AdminCategorySingleResponse, CreateAdminCategoryInput>(
      `/categories/${id}`,
      body,
    )

    return mapSingleCategoryResponse(response)
  }
}
