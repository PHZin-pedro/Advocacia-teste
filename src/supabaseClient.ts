/**
 * ============================================================================
 * CAMADA DE SERVIÇO SUPABASE (TYPESCRIPT)
 * ============================================================================
 */
import type {
  Profile,
  LegalCase,
  ChatMessage,
  LegalDocument,
  Appointment,
  BusinessHours
} from './types';

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
}

export class AureumSupabaseRepository {
  private url: string;
  private anonKey: string;

  constructor(config: SupabaseEnvConfig) {
    this.url = config.url;
    this.anonKey = config.anonKey;
  }

  public isConfigured(): boolean {
    return Boolean(
      this.url &&
      this.anonKey &&
      !this.url.includes('seu-projeto') &&
      this.url.startsWith('https://')
    );
  }

  public getHeaders(accessToken?: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.anonKey,
      Authorization: `Bearer ${accessToken || this.anonKey}`
    };
  }

  public async fetchTable<T>(table: string, query = 'select=*'): Promise<T[]> {
    if (!this.isConfigured()) return [];
    const response = await fetch(`${this.url}/rest/v1/${table}?${query}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Erro Supabase (${table}): ${response.statusText}`);
    }
    return (await response.json()) as T[];
  }
}

export type {
  Profile,
  LegalCase,
  ChatMessage,
  LegalDocument,
  Appointment,
  BusinessHours
};
