-- ============================================================================
-- SCRIPT SQL COMPLETO PARA O SUPABASE (SQL EDITOR) - VERSÃO 3.0
-- Cole TODO este conteúdo no SQL Editor do Supabase e clique em "RUN".
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Perfis (Advogados com Foto/Descrição/OAB e Clientes com CPF validado)
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null default 'client' check (role in ('client', 'admin')),
  cpf_cnpj text,
  phone text,
  oab text,
  specialty text,
  bio text,
  avatar_url text,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Processos Jurídicos
create table if not exists public.processes (
  id text primary key,
  cnj text not null,
  title text not null,
  area text not null,
  client_id text,
  client_name text,
  client_email text,
  lawyer_id text,
  lawyer_name text,
  court text,
  phase text,
  status text not null default 'Em Andamento',
  archived boolean not null default false,
  value text,
  opened_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. Movimentações Processuais
create table if not exists public.process_updates (
  id uuid primary key default gen_random_uuid(),
  process_id text not null,
  date date not null default current_date,
  title text not null,
  description text,
  author text,
  created_at timestamptz not null default now()
);

-- 4. Chat estilo WhatsApp (com escolha do Advogado destinatário e envio de PDFs)
create table if not exists public.chat_messages (
  id text primary key,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  lawyer_id text,
  lawyer_name text,
  sender_role text not null check (sender_role in ('client', 'admin')),
  sender_name text not null,
  text text not null,
  attachment_name text,
  attachment_size text,
  attachment_type text,
  attachment_url text,
  read_by_admin boolean not null default false,
  read_by_client boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Documentos & PDFs
create table if not exists public.documents (
  id text primary key,
  title text not null,
  category text default 'Documento do Caso',
  file_name text not null,
  file_size text,
  file_url text,
  direction text not null default 'client_to_admin',
  process_id text,
  client_id text not null,
  client_name text,
  client_email text,
  lawyer_id text,
  status text not null default 'Em Análise',
  note text,
  uploaded_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 6. Agenda, Audiências e Consultas (vinculadas ao Advogado escolhido)
create table if not exists public.appointments (
  id text primary key,
  client_id text,
  client_name text not null,
  client_email text not null,
  client_phone text,
  lawyer_id text,
  lawyer_name text,
  process_cnj text,
  type text not null default 'Reunião Cliente',
  modality text not null default 'Videoconferência',
  date date not null,
  time text not null,
  subject text not null,
  status text not null default 'Confirmado',
  location_or_link text,
  created_at timestamptz not null default now()
);

-- 7. Sistema Completo de Avaliações dos Clientes
create table if not exists public.reviews (
  id text primary key,
  client_name text not null,
  client_email text,
  lawyer_id text,
  lawyer_name text not null,
  area text default 'Atendimento Jurídico',
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null,
  reply text,
  featured boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Configurações do Escritório, Chave Secreta Admin & Horários
create table if not exists public.office_settings (
  id text primary key default 'default',
  firm_name text,
  firm_short_name text,
  lawyer_name text,
  lawyer_oab text,
  lawyer_email text,
  lawyer_phone text,
  firm_address text,
  admin_invite_code text default 'AUREUM-ADMIN-2026',
  business_hours jsonb not null default '{
    "openTime": "08:00",
    "closeTime": "18:00",
    "lunchStart": "12:00",
    "lunchEnd": "13:30",
    "slotMinutes": 60,
    "workingDays": [1, 2, 3, 4, 5],
    "blockedDates": []
  }'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.office_settings (id) values ('default') on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.processes enable row level security;
alter table public.process_updates enable row level security;
alter table public.chat_messages enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.office_settings enable row level security;

create policy "Acesso total profiles" on public.profiles for all using (true) with check (true);
create policy "Acesso total processes" on public.processes for all using (true) with check (true);
create policy "Acesso total process_updates" on public.process_updates for all using (true) with check (true);
create policy "Acesso total chat_messages" on public.chat_messages for all using (true) with check (true);
create policy "Acesso total documents" on public.documents for all using (true) with check (true);
create policy "Acesso total appointments" on public.appointments for all using (true) with check (true);
create policy "Acesso total reviews" on public.reviews for all using (true) with check (true);
create policy "Acesso total office_settings" on public.office_settings for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do update set public = true;

create policy "Leitura publica documentos" on storage.objects for select using (bucket_id = 'documentos');
create policy "Upload documentos" on storage.objects for insert with check (bucket_id = 'documentos');
create policy "Atualizacao documentos" on storage.objects for update using (bucket_id = 'documentos');
