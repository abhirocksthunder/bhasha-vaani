import type { AppConfig } from '../config/appConfig';

// Mirrors apps/mobile_flutter/lib/core/api/api_client.dart.
export class ApiException extends Error {
  readonly statusCode: number;
  readonly body: string;

  constructor(statusCode: number, body: string) {
    super(`ApiException(${statusCode}): ${body}`);
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class ApiClient {
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  private endpoint(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.apiBaseUrl}${normalizedPath}`;
  }

  private async throwIfUnsuccessful(response: Response): Promise<void> {
    if (!response.ok) {
      const body = await response.text();
      throw new ApiException(response.status, body);
    }
  }

  async getList<T = unknown>(path: string): Promise<T[]> {
    const response = await fetch(this.endpoint(path));
    await this.throwIfUnsuccessful(response);
    return (await response.json()) as T[];
  }

  async getMap<T = Record<string, unknown>>(path: string): Promise<T> {
    const response = await fetch(this.endpoint(path));
    await this.throwIfUnsuccessful(response);
    return (await response.json()) as T;
  }

  async postMap<T = Record<string, unknown>>(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(this.endpoint(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await this.throwIfUnsuccessful(response);
    return (await response.json()) as T;
  }
}
