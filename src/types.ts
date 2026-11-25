/**
 * ============================================================================
 * DEFINIÇÕES DE TIPOS TYPESCRIPT DO SISTEMA JURÍDICO
 * ============================================================================
 */

export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf_cnpj?: string;
  phone?: string;
  oab?: string;
  verified: boolean;
  created_at: string;
}

export interface CaseUpdate {
  id: string;
  process_id: string;
  date: string;
  title: string;
  description: string;
  author: string;
}

export interface LegalCase {
  id: string;
  cnj: string;
  title: string;
  area: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  court: string;
  phase: string;
  status: 'Em Andamento' | 'Aguardando Audiência' | 'Em Recurso' | 'Concluído';
  archived: boolean;
  value?: string;
  opened_at: string;
  updates?: CaseUpdate[];
}

export interface ChatMessage {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  sender_role: UserRole;
  sender_name: string;
  text: string;
  attachment_name?: string;
  attachment_size?: string;
  attachment_type?: string;
  attachment_url?: string;
  read_by_admin: boolean;
  read_by_client: boolean;
  created_at: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_size: string;
  file_url?: string;
  direction: 'client_to_admin' | 'admin_to_client';
  process_id?: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  status: 'Em Análise' | 'Aprovado' | 'Solicitado Ajuste';
  note?: string;
  uploaded_at: string;
}

export interface Appointment {
  id: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  process_cnj?: string;
  type: 'Reunião Cliente' | 'Audiência' | 'Prazo Processual' | 'Consulta Inicial';
  modality: 'Presencial' | 'Videoconferência' | 'Fórum / Tribunal';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  subject: string;
  status: 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado';
  location_or_link?: string;
}

export interface BusinessHours {
  openTime: string;       // ex: "08:00"
  closeTime: string;      // ex: "18:00"
  lunchStart: string;     // ex: "12:00"
  lunchEnd: string;       // ex: "13:30"
  slotMinutes: number;    // ex: 60
  workingDays: number[];  // 0=Dom, 1=Seg, ..., 6=Sab
  blockedDates: string[]; // ["2026-12-25", ...]
}
