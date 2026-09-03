import type { AdminStoreRepository } from '@application/ports/AdminStoreRepository'
import type {
  AdminStore,
  CreateAdminStoreInput,
  UpdateAdminStoreInput,
} from '@domain/entities/AdminStore'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  adminStoreDtoSchema,
  adminStoreListResponseSchema,
  adminStoreSingleResponseSchema,
  type AdminStoreDto,
  type AdminStoreListResponse,
  type AdminStoreSingleResponse,
} from '@infrastructure/dto/AdminStoreDto'

function mapStoreDtoToDomain(dto: AdminStoreDto): AdminStore {
  const parsed = adminStoreDtoSchema.parse(dto)

  return {
    id: parsed.id,
    name: parsed.name,
    slug: parsed.slug,
    address: parsed.address,
    district: parsed.district,
    reference: parsed.reference,
    pickupEnabled: parsed.pickupEnabled,
    courierEnabled: parsed.courierEnabled,
    active: parsed.active,
  }
}

function mapStoreListResponse(response: AdminStoreListResponse): AdminStore[] {
  const parsed = adminStoreListResponseSchema.parse(response)

  if (Array.isArray(parsed)) {
    return parsed.map(mapStoreDtoToDomain)
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map(mapStoreDtoToDomain)
  }

  return parsed.data.stores.map(mapStoreDtoToDomain)
}

function mapSingleStoreResponse(response: AdminStoreSingleResponse): AdminStore {
  const parsed = adminStoreSingleResponseSchema.parse(response)

  if ('id' in parsed) {
    return mapStoreDtoToDomain(parsed)
  }

  if ('id' in parsed.data) {
    return mapStoreDtoToDomain(parsed.data)
  }

  return mapStoreDtoToDomain(parsed.data.store)
}

export class HttpAdminStoreRepository implements AdminStoreRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async list(): Promise<AdminStore[]> {
    const response = await this.httpClient.get<AdminStoreListResponse>('/stores')
    return mapStoreListResponse(response)
  }

  async create(payload: CreateAdminStoreInput): Promise<AdminStore> {
    const response = await this.httpClient.post<AdminStoreSingleResponse, CreateAdminStoreInput>(
      '/stores',
      payload,
    )

    return mapSingleStoreResponse(response)
  }

  async update(payload: UpdateAdminStoreInput): Promise<AdminStore> {
    const { id, ...body } = payload

    const response = await this.httpClient.put<AdminStoreSingleResponse, CreateAdminStoreInput>(
      `/stores/${id}`,
      body,
    )

    return mapSingleStoreResponse(response)
  }
}
