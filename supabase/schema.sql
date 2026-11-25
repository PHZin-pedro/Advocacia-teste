-- ============================================================================
-- AUREUM ADVOCACIA - SCRIPT SQL DEFINITIVO PARA O SUPABASE (SQL EDITOR)
-- Inclui: Perfis (Admin, Advogado e Cliente), Edição de Senha pelo Admin,
-- Exclusão/Demissão Segura de Advogados, Chave Secreta Exclusiva do Admin,
-- Ordenação de Chats Mais Recentes no Topo, Processos, Documentos, Agenda,
-- Avaliações, RLS e Bucket de Storage.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. PERFIS (Admin Master, Advogados e Clientes)
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text unique not null,
  password_hash text,
  role text not null default 'client',
  cpf_cnpj text,
  phone text,
  oab text,
  specialty text,
  bio text,
  avatar_url text,
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists password_hash text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('client', 'lawyer', 'admin'));

-- 2. PROCESSOS JURÍDICOS
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

-- 3. MOVIMENTAÇÕES PROCESSUAIS
create table if not exists public.process_updates (
  id uuid primary key default gen_random_uuid(),
  process_id text not null,
  date date not null default current_date,
  title text not null,
  description text,
  author text,
  created_at timestamptz not null default now()
);

-- 4. CHAT ESTILO WHATSAPP (Com envio de PDFs e ordenação por mais recentes)
create table if not exists public.chat_messages (
  id text primary key,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  lawyer_id text,
  lawyer_name text,
  sender_role text not null check (sender_role in ('client', 'lawyer', 'admin')),
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

alter table public.chat_messages drop constraint if exists chat_messages_sender_role_check;
alter table public.chat_messages
  add constraint chat_messages_sender_role_check check (sender_role in ('client', 'lawyer', 'admin'));

-- 5. DOCUMENTOS & PDFS
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

-- 6. AGENDA, AUDIÊNCIAS E CONSULTAS
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

-- 7. SISTEMA COMPLETO DE AVALIAÇÕES DOS CLIENTES
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

-- 8. CONFIGURAÇÕES DO ESCRITÓRIO, CHAVE SECRETA (EXCLUSIVA DO ADMIN) & HORÁRIOS
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

-- ============================================================================
-- ÍNDICES PARA CHATS MAIS RECENTES NO TOPO E CONSULTAS RÁPIDAS
-- ============================================================================
create index if not exists idx_chat_messages_created_at_desc on public.chat_messages (created_at desc);
create index if not exists idx_chat_messages_client_recent on public.chat_messages (client_id, created_at desc);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_processes_lawyer_id on public.processes (lawyer_id);
create index if not exists idx_appointments_lawyer_date on public.appointments (lawyer_id, date);
create index if not exists idx_reviews_created_at_desc on public.reviews (created_at desc);

-- View auxiliar com as conversas ordenadas pelo chat mais recente no topo
create or replace view public.recent_chat_threads as
select distinct on (client_id)
  client_id,
  client_name,
  client_email,
  client_phone,
  lawyer_id,
  lawyer_name,
  text as last_message,
  attachment_name as last_attachment,
  created_at as last_message_at
from public.chat_messages
order by client_id, created_at desc;

-- ============================================================================
-- FUNÇÕES E TRIGGER PARA ADMIN GERENCIAR / DEMITIR ADVOGADOS COM SEGURANÇA
-- ============================================================================
create or replace function public.fn_cleanup_deleted_lawyer()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.processes set lawyer_id = null where lawyer_id = old.id;
  update public.chat_messages set lawyer_id = null where lawyer_id = old.id;
  update public.documents set lawyer_id = null where lawyer_id = old.id;
  update public.appointments set lawyer_id = null where lawyer_id = old.id;
  update public.reviews set lawyer_id = null where lawyer_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_cleanup_deleted_lawyer on public.profiles;
create trigger trg_cleanup_deleted_lawyer
before delete on public.profiles
for each row
execute function public.fn_cleanup_deleted_lawyer();

create or replace function public.admin_update_lawyer_password(
  p_admin_id text,
  p_target_user_id text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_admin_role text;
begin
  select role into v_admin_role from public.profiles where id = p_admin_id;
  if v_admin_role is distinct from 'admin' then
    raise exception 'Acesso negado: apenas a conta Admin pode alterar senhas de advogados.';
  end if;

  update public.profiles
  set password_hash = p_new_password
  where id = p_target_user_id and role in ('lawyer', 'admin');

  return found;
end;
$$;

create or replace function public.admin_delete_lawyer_account(
  p_admin_id text,
  p_target_user_id text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_admin_role text;
begin
  select role into v_admin_role from public.profiles where id = p_admin_id;
  if v_admin_role is distinct from 'admin' then
    raise exception 'Acesso negado: apenas a conta Admin pode excluir contas de advogados.';
  end if;

  if p_admin_id = p_target_user_id then
    raise exception 'Operação inválida: a conta Admin principal não pode excluir a si mesma.';
  end if;

  delete from public.profiles
  where id = p_target_user_id and role = 'lawyer';

  return found;
end;
$$;

-- ============================================================================
-- DADOS INICIAIS PADRÃO
-- ============================================================================
insert into public.office_settings (id, admin_invite_code)
values ('default', 'AUREUM-ADMIN-2026')
on conflict (id) do nothing;

insert into public.profiles (id, name, email, password_hash, role, oab, specialty, bio, phone, verified)
values (
  'admin-1',
  'Dr. Henrique Valença',
  'advogado@aureum.com.br',
  '123',
  'admin',
  'OAB/SP 348.920',
  'Direito Empresarial & Contratos',
  'Sócio fundador e Administrador Master com mais de 15 anos de atuação em contencioso estratégico, defesa corporativa e contratos de alta complexidade.',
  '(11) 99842-7100',
  true
)
on conflict (id) do nothing;

insert into public.profiles (id, name, email, password_hash, role, oab, specialty, bio, phone, verified)
values (
  'lawyer-1',
  'Dra. Camila Monteiro',
  'camila@aureum.com.br',
  '123',
  'lawyer',
  'OAB/SP 412.780',
  'Direito Trabalhista & Família',
  'Especialista em resolução de conflitos trabalhistas estratégicos, inventários extrajudiciais e planejamento sucessório familiar.',
  '(11) 99715-4420',
  true
)
on conflict (id) do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.processes enable row level security;
alter table public.process_updates enable row level security;
alter table public.chat_messages enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.office_settings enable row level security;

drop policy if exists "Acesso total profiles" on public.profiles;
drop policy if exists "Acesso total processes" on public.processes;
drop policy if exists "Acesso total process_updates" on public.process_updates;
drop policy if exists "Acesso total chat_messages" on public.chat_messages;
drop policy if exists "Acesso total documents" on public.documents;
drop policy if exists "Acesso total appointments" on public.appointments;
drop policy if exists "Acesso total reviews" on public.reviews;
drop policy if exists "Acesso total office_settings" on public.office_settings;

create policy "Acesso total profiles" on public.profiles for all using (true) with check (true);
create policy "Acesso total processes" on public.processes for all using (true) with check (true);
create policy "Acesso total process_updates" on public.process_updates for all using (true) with check (true);
create policy "Acesso total chat_messages" on public.chat_messages for all using (true) with check (true);
create policy "Acesso total documents" on public.documents for all using (true) with check (true);
create policy "Acesso total appointments" on public.appointments for all using (true) with check (true);
create policy "Acesso total reviews" on public.reviews for all using (true) with check (true);
create policy "Acesso total office_settings" on public.office_settings for all using (true) with check (true);

-- ============================================================================
-- BUCKET DE STORAGE PARA PDFS, DOCUMENTOS E FOTOS DE PERFIL
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do update set public = true;

drop policy if exists "Leitura publica documentos" on storage.objects;
drop policy if exists "Upload documentos" on storage.objects;
drop policy if exists "Atualizacao documentos" on storage.objects;

create policy "Leitura publica documentos" on storage.objects for select using (bucket_id = 'documentos');
create policy "Upload documentos" on storage.objects for insert with check (bucket_id = 'documentos');
create policy "Atualizacao documentos" on storage.objects for update using (bucket_id = 'documentos');
