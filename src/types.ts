export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf_cnpj?: string;
  phone?: string;
  oab?: string;
  specialty?: string;
  bio?: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  client_name: string;
  client_email?: string;
  lawyer_id?: string;
  lawyer_name: string;
  area: string;
  rating: number; // 1 a 5
  comment: string;
  reply?: string;
  featured: boolean;
  created_at: string;
}
