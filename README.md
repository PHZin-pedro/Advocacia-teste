# ⚖️ AUREUM | Plataforma Jurídica Multi-Advogados (Versão Definitiva v4.0)

## Funcionalidades Principais
1. **Login Limpo e Seguro (`login.html`):** Sem botões de acesso rápido demonstrativo. Autenticação via e-mail e senha para Admin, Advogados e Clientes.
2. **Hierarquia de Permissões (Admin vs. Advogado):**
   - **Conta Admin (`role: 'admin'`):** Acesso exclusivo à **Chave Secreta** para novos advogados, edição de senhas de qualquer advogado e **exclusão imediata de conta** caso um advogado seja demitido (preservando os processos e mensagens históricas dos clientes).
   - **Conta Advogado (`role: 'lawyer'`):** Acesso completo ao chat, PDFs, agenda, processos, avaliações e edição do próprio perfil público, **sem acesso à chave secreta** nem à gestão de contas de outros advogados.
3. **Chats Mais Recentes no Topo:** A lista de conversas ordena automaticamente os atendimentos pela última mensagem recebida ou enviada.
4. **Modo Escuro / Modo Claro em Todas as Abas:** Alternância sincronizada em todas as páginas (`index.html`, `login.html`, `cliente.html`, `admin.html`).
5. **Validação Rigorosa de CPF (11 dígitos + Dígito Verificador) e OAB/UF.**
6. **Integração Completa com Supabase (`supabase/schema.sql`) e Deploy em Vercel / Render.**
