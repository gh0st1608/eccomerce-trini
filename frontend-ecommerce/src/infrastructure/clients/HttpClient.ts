export interface HttpClient {
  get<T>(path: string): Promise<T>
  post<TResponse, TBody>(path: string, body: TBody): Promise<TResponse>
  put<TResponse, TBody>(path: string, body: TBody): Promise<TResponse>
}
