import type { Profile, Review } from './types';

export class AureumSupabaseRepository {
  constructor(private url: string, private anonKey: string) {}
  public isConfigured(): boolean {
    return Boolean(this.url && this.anonKey && this.url.startsWith('https://'));
  }
}

export type { Profile, Review };
