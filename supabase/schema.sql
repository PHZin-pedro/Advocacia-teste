-- ============================================================================
-- SCRIPT SQL COMPLETO PARA O SUPABASE (SQL EDITOR)
-- Copie TODO este conteúdo, cole no SQL Editor do seu projeto Supabase e clique
-- em "RUN" para criar todas as tabelas, políticas de acesso, Realtime e Storage.
-- ============================================================================

-- 1. Extensão UUID
create extension if not exists "pgcrypto";

-- 2. Tabela de Perfis (Clientes e Advogados Administradores)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null default 'client' check (role in ('client', 'admin')),
  cpf_cnpj text,
  phone text,
  oab text,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Tabela de Processos Jurídicos (Casos em Aberto e Arquivados)
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  cnj text not null,
  title text not null,
  area text not null,
  client_id uuid references public.profiles(id) on delete cascade,
  client_name text,
  client_email text,
  court text,
  phase text,
  status text not null default 'Em Andamento',
  archived boolean not null default false,
  value text,
  opened_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 4. Tabela de Movimentações / Andamentos Processuais
create table if not exists public.process_updates (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  date date not null default current_date,
  title text not null,
  description text,
  author text,
  created_at timestamptz not null default now()
);

-- 5. Tabela de Chat estilo WhatsApp (Mensagens + Envio de Documentos/PDFs)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
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

-- 6. Tabela de Repositório de Documentos e PDFs
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Documento do Caso',
  file_name text not null,
  file_size text,
  file_url text,
  direction text not null default 'client_to_admin',
  process_id uuid references public.processes(id) on delete set null,
  client_id text not null,
  client_name text,
  client_email text,
  status text not null default 'Em Análise',
  note text,
  uploaded_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 7. Tabela de Agenda, Audiências e Reuniões
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id text,
  client_name text not null,
  client_email text not null,
  client_phone text,
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

-- 8. Tabela de Configurações do Escritório & Horários de Funcionamento
create table if not exists public.office_settings (
  id text primary key default 'default',
  firm_name text,
  lawyer_name text,
  lawyer_oab text,
  lawyer_email text,
  lawyer_phone text,
  firm_address text,
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

insert into public.office_settings (id)
values ('default')
on conflict (id) do nothing;

-- 9. Habilitar Row Level Security (RLS) com políticas abertas para operação via Frontend
alter table public.profiles enable row level security;
alter table public.processes enable row level security;
alter table public.process_updates enable row level security;
alter table public.chat_messages enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.office_settings enable row level security;

create policy "Acesso total profiles" on public.profiles for all using (true) with check (true);
create policy "Acesso total processes" on public.processes for all using (true) with check (true);
create policy "Acesso total process_updates" on public.process_updates for all using (true) with check (true);
create policy "Acesso total chat_messages" on public.chat_messages for all using (true) with check (true);
create policy "Acesso total documents" on public.documents for all using (true) with check (true);
create policy "Acesso total appointments" on public.appointments for all using (true) with check (true);
create policy "Acesso total office_settings" on public.office_settings for all using (true) with check (true);

-- 10. Habilitar Realtime para Chat e Agenda instantâneos
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.processes;

-- 11. Criar Bucket de Storage para PDFs e Documentos
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do update set public = true;

create policy "Leitura publica documentos"
  on storage.objects for select
  using (bucket_id = 'documentos');

create policy "Upload documentos"
  on storage.objects for insert
  with check (bucket_id = 'documentos');

create policy "Atualizacao documentos"
  on storage.objects for update
  using (bucket_id = 'documentos');
