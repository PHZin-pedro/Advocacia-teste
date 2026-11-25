# ⚖️ AUREUM | Plataforma Jurídica Completa (Pronta para Venda & Deploy)

Projeto completo em **Branco & Dourado** com **Modo Claro / Modo Escuro**, **Portal do Cliente**, **Painel Administrativo do Advogado**, **Chat estilo WhatsApp com envio e visualização de PDFs**, **Calendário Mensal Interativo**, **Configurador de Horários de Funcionamento**, **Gestão de Casos em Aberto e Arquivados**, **Tela de Carregamento**, e arquivos organizados em `.html`, `.css`, `.js`, `.ts`, `.py` e `.sql`.

---

## 📁 Estrutura de Arquivos do Projeto

```text
aureum-advocacia-pro/
├── public/
│   ├── index.html          # Site Institucional + Envio de Caso/PDF + Agendamento
│   ├── login.html          # Login, Cadastro com Verificação OTP 6 dígitos e Acesso Admin
│   ├── cliente.html        # Portal do Cliente (Chat WhatsApp, PDFs, Processos, Agenda)
│   ├── admin.html          # Painel do Advogado (Chat PDFs, Calendário, Horários, Casos)
│   ├── css/
│   │   └── styles.css      # Design System Branco & Dourado + Modo Escuro + Responsivo
│   └── js/
│       ├── config.js       # 👉 EDITE AQUI O NOME DO ADVOGADO, OAB, TELEFONE E SUPABASE
│       ├── store.js        # Engine de dados (Supabase Realtime + Storage + LocalStorage)
│       ├── public.js       # Lógica da página inicial
│       ├── auth.js         # Lógica de login, cadastro OTP e acesso administrativo
│       ├── client.js       # Lógica do Portal do Cliente
│       └── admin.js        # Lógica do Painel do Advogado
├── src/
│   ├── types.ts            # Tipagens TypeScript completas
│   └── supabaseClient.ts   # Repositório TypeScript para Supabase
├── backend_python/
│   ├── app.py              # Servidor alternativo em Python (FastAPI)
│   └── requirements.txt    # Dependências Python
├── supabase/
│   └── schema.sql          # 👉 SCRIPT SQL COMPLETO PARA COLAR NO SUPABASE
├── api/
│   └── config.js           # Serverless Function para Vercel
├── server.js               # Servidor Node.js / Express para Render e execução local
├── package.json            # Dependências Node.js
├── render.yaml             # Configuração automática do Render
├── vercel.json             # Configuração automática da Vercel
└── .env.example            # Modelo de variáveis de ambiente
```

---

## 🛠️ Como Rodar no Seu Computador (Node.js)

1. Extraia o arquivo `.zip` em uma pasta.
2. Abra o terminal dentro da pasta e execute:
   ```bash
   npm install
   npm start
   ```
3. Acesse `http://localhost:3000`.

---

## 🗄️ Passo a Passo no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um **New Project**.
2. No menu lateral esquerdo, clique em **SQL Editor** > **New Query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no SQL Editor e clique em **RUN**.
4. Vá em **Project Settings** > **API** e copie:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_ANON_KEY`)

---

## 🚀 Como Publicar no Render (Recomendado — Mais Fácil)

1. Suba esta pasta para um repositório no **GitHub**.
2. Acesse [render.com](https://render.com), clique em **New +** > **Web Service** e conecte seu repositório do GitHub.
3. Confirme os comandos:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Na aba **Environment** do Render, adicione as variáveis:
   - `SUPABASE_URL` = (sua URL do Supabase)
   - `SUPABASE_ANON_KEY` = (sua chave anon do Supabase)
   - `ADMIN_INVITE_CODE` = `AUREUM-ADMIN-2026` (ou a senha que desejar)
5. Clique em **Deploy Web Service**. Pronto!
