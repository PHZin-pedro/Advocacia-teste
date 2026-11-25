let currentAdmin = null;
let selectedClientId = null;
let showArchivedCases = false;
let calendarCursor = new Date();
let selectedCalDate = new Date().toISOString().split("T")[0];

function isMasterAdmin() {
  return Boolean(currentAdmin && currentAdmin.role === "admin");
}

function switchAdminTab(tab) {
  document.querySelectorAll(".sidebar-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tab-${tab}`);
  });
}

async function updateAdminKpis() {
  const cases = await AureumStore.getCases();
  const docs = await AureumStore.getDocuments();
  const msgs = await AureumStore.getMessages();
  const reviews = await AureumStore.getReviews();

  document.getElementById("kpi-open-cases").textContent = cases.filter((c) => !c.archived).length;
  document.getElementById("kpi-archived-cases").textContent = cases.filter((c) => c.archived).length;
  document.getElementById("kpi-docs-count").textContent = docs.length;

  const avg = reviews.length > 0
    ? (reviews.reduce((a, r) => a + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";
  document.getElementById("kpi-rating-avg").textContent = `${avg} ★`;

  const unread = msgs.filter((m) => m.sender_role === "client" && !m.read_by_admin).length;
  document.getElementById("badge-unread-chat").textContent = unread;
}

// ============================================================================
// 1. CHAT ESTILO WHATSAPP (CONVERSAS MAIS RECENTES SEMPRE NO TOPO)
// ============================================================================
async function renderAdminChatContacts() {
  const msgs = await AureumStore.getMessages();
  const search = (document.getElementById("chat-search-client").value || "").toLowerCase();
  const filterMode = document.getElementById("chat-filter-lawyer").value;

  const filteredMsgs = filterMode === "mine"
    ? msgs.filter((m) => !m.lawyer_id || m.lawyer_id === currentAdmin.id)
    : msgs;

  const threadsMap = new Map();
  filteredMsgs.forEach((m) => {
    const msgTime = m.created_at ? new Date(m.created_at).getTime() : 0;
    const existing = threadsMap.get(m.client_id) || {
      client_id: m.client_id,
      client_name: m.client_name,
      client_email: m.client_email,
      lawyer_name: m.lawyer_name || "",
      lastMessage: m.text,
      lastTimestamp: 0,
      lastTimeFormatted: "",
      unread: 0
    };

    if (msgTime >= existing.lastTimestamp) {
      existing.lastTimestamp = msgTime;
      existing.lastMessage = m.attachment_name ? `📄 ${m.attachment_name}` : m.text;
      existing.lastTimeFormatted = msgTime
        ? new Date(msgTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "";
      if (m.lawyer_name) existing.lawyer_name = m.lawyer_name;
    }

    if (m.sender_role === "client" && !m.read_by_admin) existing.unread += 1;
    threadsMap.set(m.client_id, existing);
  });

  // Ordena do chat MAIS RECENTE para o mais antigo (topo = última mensagem recebida/enviada)
  const threads = Array.from(threadsMap.values())
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
    .filter(
      (t) => t.client_name.toLowerCase().includes(search) || t.client_email.toLowerCase().includes(search)
    );

  if (!selectedClientId && threads.length > 0) selectedClientId = threads[0].client_id;

  const listEl = document.getElementById("admin-chat-contact-list");
  if (threads.length === 0) {
    listEl.innerHTML = `<div style="padding:16px; color:var(--text-muted); font-size:0.85rem;">Nenhuma conversa encontrada.</div>`;
    return;
  }

  listEl.innerHTML = threads
    .map((t) => `
      <div class="chat-contact-item ${t.client_id === selectedClientId ? "active" : ""}" onclick="selectChatThread('${t.client_id}')">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <strong style="font-size:0.9rem;">${t.client_name}</strong>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.7rem; color:var(--text-muted);">${t.lastTimeFormatted}</span>
            ${t.unread > 0 ? `<span class="badge badge-gold">${t.unread}</span>` : ""}
          </div>
        </div>
        <div style="font-size:0.74rem; color:var(--gold-500); font-weight:600;">${t.client_email}</div>
        <div style="font-size:0.78rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.lastMessage}</div>
      </div>`)
    .join("");
}

window.selectChatThread = async function (clientId) {
  selectedClientId = clientId;
  await AureumStore.markThreadRead(clientId, currentAdmin.role);
  await renderAdminChatContacts();
  await renderAdminActiveMessages();
  await updateAdminKpis();
};

async function renderAdminActiveMessages() {
  const msgs = await AureumStore.getMessages();
  const threadMsgs = msgs.filter((m) => m.client_id === selectedClientId);
  const box = document.getElementById("admin-chat-messages");

  if (threadMsgs.length === 0) {
    document.getElementById("active-chat-client-name").textContent = "Selecione uma conversa";
    document.getElementById("active-chat-client-meta").textContent = "";
    box.innerHTML = "";
    return;
  }

  const head = threadMsgs[0];
  document.getElementById("active-chat-client-name").textContent = head.client_name;
  document.getElementById("active-chat-client-meta").textContent =
    `📧 ${head.client_email} ${head.client_phone ? "• 📱 " + head.client_phone : ""}`;

  box.innerHTML = threadMsgs
    .map((m) => {
      const isOut = m.sender_role === "admin" || m.sender_role === "lawyer";
      const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const attachmentHtml = m.attachment_name
        ? `<div class="msg-attachment">
             <div><strong>📄 ${m.attachment_name}</strong><div style="font-size:0.74rem; color:var(--text-muted);">${m.attachment_size || "PDF"}</div></div>
             ${m.attachment_url && m.attachment_url !== "#documento-demonstrativo"
               ? `<a href="${m.attachment_url}" download="${m.attachment_name}" class="btn btn-gold btn-sm">Baixar PDF</a>`
               : `<span class="badge badge-gold">Anexado</span>`}
           </div>`
        : "";
      return `
        <div class="msg-bubble ${isOut ? "outgoing" : "incoming"}">
          <div style="font-size:0.74rem; font-weight:700; color:var(--gold-500); margin-bottom:3px;">
            ${isOut ? m.sender_name : `${m.client_name} (${m.client_email})`}
          </div>
          <div>${m.text}</div>
          ${attachmentHtml}
          <div class="msg-meta"><span>${time}</span><span>${isOut ? "✓✓ Respondido" : "Cliente"}</span></div>
        </div>`;
    })
    .join("");
  box.scrollTop = box.scrollHeight;
}

// ============================================================================
// 2. CALENDÁRIO & HORÁRIOS
// ============================================================================
async function renderAdminCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  document.getElementById("cal-month-label").textContent =
    calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const apts = await AureumStore.getAppointments();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  let html = "";
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayApts = apts.filter((a) => a.date === dateStr && a.status !== "Cancelado");
    html += `
      <div class="cal-day ${dateStr === selectedCalDate ? "selected" : ""} ${dateStr === todayStr ? "today" : ""}" onclick="selectCalendarDate('${dateStr}')">
        <span class="cal-day-num">${day}</span>
        <div class="cal-dots">${dayApts.map(() => `<span class="cal-dot"></span>`).join("")}</div>
      </div>`;
  }
  document.getElementById("admin-calendar-grid").innerHTML = html;

  const dayApts = apts.filter((a) => a.date === selectedCalDate);
  document.getElementById("selected-date-label").textContent = `Data: ${selectedCalDate}`;
  document.getElementById("day-appointments-list").innerHTML =
    dayApts.length === 0
      ? `<p style="color:var(--text-muted); font-size:0.84rem;">Sem compromissos neste dia.</p>`
      : dayApts.map((a) => `
        <div style="padding:10px 12px; border-radius:10px; background:var(--bg-primary); border:1px solid var(--border-color);">
          <strong>⏰ ${a.time} — ${a.client_name}</strong>
          <div style="font-size:0.84rem;">${a.subject}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Resp: ${a.lawyer_name || currentAdmin.name} • ${a.modality}</div>
        </div>`).join("");
}

window.selectCalendarDate = async function (dateStr) {
  selectedCalDate = dateStr;
  document.getElementById("aapt-date").value = dateStr;
  await renderAdminCalendar();
};

// ============================================================================
// 3. CASOS, DOCUMENTOS & AVALIAÇÕES
// ============================================================================
async function renderAdminCases() {
  const cases = await AureumStore.getCases();
  const filtered = cases.filter((c) => Boolean(c.archived) === showArchivedCases);
  const container = document.getElementById("admin-cases-container");
  container.innerHTML =
    filtered.length === 0
      ? `<div class="card"><p style="color:var(--text-muted);">Nenhum caso nesta categoria.</p></div>`
      : filtered.map((c) => `
        <div class="card">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px;">
            <div>
              <span class="badge badge-gold">${c.area}</span>
              <h3 style="margin-top:6px;">${c.title}</h3>
              <div style="font-size:0.84rem; color:var(--text-secondary);">CNJ: <strong>${c.cnj}</strong> • Cliente: ${c.client_name}</div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline btn-sm" onclick="addCaseUpdatePrompt('${c.id}')">+ Movimentação</button>
              <button class="btn ${c.archived ? "btn-gold" : "btn-danger"} btn-sm" onclick="toggleArchiveCase('${c.id}')">
                ${c.archived ? "♻️ Reabrir" : "📦 Arquivar"}
              </button>
            </div>
          </div>
        </div>`).join("");
}

window.toggleArchiveCase = async function (id) {
  const cases = await AureumStore.getCases();
  const t = cases.find((c) => c.id === id);
  if (!t) return;
  t.archived = !t.archived;
  await AureumStore.saveCase(t);
  await renderAdminCases();
  await updateAdminKpis();
};

window.addCaseUpdatePrompt = async function (id) {
  const title = prompt("Título da movimentação:");
  if (!title) return;
  const description = prompt("Descrição:") || "";
  const cases = await AureumStore.getCases();
  const t = cases.find((c) => c.id === id);
  if (!t) return;
  t.updates = t.updates || [];
  t.updates.unshift({ id: "upd-" + Date.now(), date: new Date().toISOString().split("T")[0], title, description, author: currentAdmin.name });
  await AureumStore.saveCase(t);
  await renderAdminCases();
  AureumStore.toast("Movimentação publicada!");
};

async function renderAdminDocs() {
  const docs = await AureumStore.getDocuments();
  document.getElementById("admin-docs-tbody").innerHTML =
    docs.length === 0
      ? `<tr><td colspan="6" style="text-align:center;">Nenhum documento.</td></tr>`
      : docs.map((d) => `
        <tr>
          <td><strong>${d.client_name || "Cliente"}</strong><div style="font-size:0.75rem; color:var(--text-muted);">${d.client_email || ""}</div></td>
          <td>${d.title}</td>
          <td>📄 ${d.file_name}</td>
          <td>${d.uploaded_at}</td>
          <td><span class="badge ${d.status === "Aprovado" ? "badge-success" : "badge-warning"}">${d.status}</span></td>
          <td style="display:flex; gap:6px;">
            ${d.file_url && d.file_url !== "#documento-demonstrativo" ? `<a href="${d.file_url}" download="${d.file_name}" class="btn btn-outline btn-sm">Baixar</a>` : ""}
            <button class="btn btn-gold btn-sm" onclick="approveDoc('${d.id}')">✓ Validar</button>
          </td>
        </tr>`).join("");
}

window.approveDoc = async function (id) {
  const docs = await AureumStore.getDocuments();
  const d = docs.find((x) => x.id === id);
  if (!d) return;
  d.status = "Aprovado";
  await AureumStore.saveDocument(d);
  await renderAdminDocs();
  AureumStore.toast("Documento aprovado!");
};

async function renderAdminReviews() {
  const reviews = await AureumStore.getReviews();
  const listEl = document.getElementById("admin-reviews-list");
  if (reviews.length === 0) {
    listEl.innerHTML = `<p style="color:var(--text-muted);">Nenhuma avaliação recebida ainda.</p>`;
    return;
  }
  listEl.innerHTML = reviews
    .map((r) => {
      const stars = "★".repeat(Number(r.rating || 5)) + "☆".repeat(5 - Number(r.rating || 5));
      return `
        <div style="padding:16px; border-radius:12px; border:1px solid var(--border-subtle); background:var(--bg-primary);">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; margin-bottom:8px;">
            <div>
              <strong>${r.client_name}</strong> • <span style="font-size:0.8rem; color:var(--gold-500); font-weight:700;">Avaliou ${r.lawyer_name}</span>
            </div>
            <div class="stars-display">${stars}</div>
          </div>
          <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:10px;">"${r.comment}"</p>
          ${r.reply ? `<div style="padding:8px 12px; border-radius:8px; background:var(--gold-soft); font-size:0.82rem; margin-bottom:10px;"><strong>Sua resposta:</strong> ${r.reply}</div>` : ""}
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="replyReview('${r.id}')">💬 Responder Avaliação</button>
            <button class="btn btn-danger btn-sm" onclick="removeReview('${r.id}')">Excluir</button>
          </div>
        </div>`;
    })
    .join("");
}

window.replyReview = async function (revId) {
  const reviews = await AureumStore.getReviews();
  const target = reviews.find((r) => r.id === revId);
  if (!target) return;
  const replyText = prompt("Escreva sua resposta pública para esta avaliação:", target.reply || "");
  if (replyText === null) return;
  target.reply = replyText.trim();
  await AureumStore.saveReview(target);
  await renderAdminReviews();
  AureumStore.toast("💬 Resposta publicada na avaliação!");
};

window.removeReview = async function (revId) {
  if (!confirm("Remover esta avaliação?")) return;
  await AureumStore.deleteReview(revId);
  await renderAdminReviews();
  await updateAdminKpis();
  AureumStore.toast("Avaliação removida.");
};

// ============================================================================
// 4. EXCLUSIVO CONTA ADMIN: GERENCIAR ADVOGADOS (EDITAR SENHA E DEMITIR/EXCLUIR)
// ============================================================================
async function renderAdminLawyersManagement() {
  if (!isMasterAdmin()) return;
  const users = await AureumStore.getUsers();
  const lawyers = users.filter((u) => u.role === "lawyer");
  const container = document.getElementById("admin-lawyers-management-list");
  if (!container) return;

  if (lawyers.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.88rem;">Nenhum advogado associado cadastrado no momento.</p>`;
    return;
  }

  container.innerHTML = lawyers
    .map((l) => `
      <div style="padding:14px 16px; border-radius:12px; border:1px solid var(--border-subtle); background:var(--bg-primary); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;">
        <div>
          <strong style="font-size:0.96rem; display:block;">${l.name}</strong>
          <div style="font-size:0.8rem; color:var(--gold-500); font-weight:700;">${l.oab || "OAB"} • ${l.specialty || "Advogado"}</div>
          <div style="font-size:0.78rem; color:var(--text-secondary);">📧 ${l.email} • Senha atual: <code>${l.password || l.password_hash || "***"}</code></div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="editLawyerPasswordPrompt('${l.id}', '${l.name.replace(/'/g, "\'")}')">
            🔑 Editar Senha
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="fireLawyerAccount('${l.id}', '${l.name.replace(/'/g, "\'")}')">
            🗑️ Excluir Conta (Demitir)
          </button>
        </div>
      </div>`)
    .join("");
}

window.editLawyerPasswordPrompt = async function (lawyerId, lawyerName) {
  if (!isMasterAdmin()) {
    AureumStore.toast("❌ Acesso negado: apenas o Admin pode alterar senhas.");
    return;
  }
  const newPass = prompt(`Digite a nova senha para ${lawyerName}:`);
  if (!newPass || newPass.trim().length < 3) {
    if (newPass !== null) AureumStore.toast("⚠️ A senha deve ter pelo menos 3 caracteres.");
    return;
  }
  await AureumStore.adminUpdateLawyerPassword(currentAdmin.id, lawyerId, newPass.trim());
  await renderAdminLawyersManagement();
  AureumStore.toast(`🔑 Senha de ${lawyerName} atualizada com sucesso!`);
};

window.fireLawyerAccount = async function (lawyerId, lawyerName) {
  if (!isMasterAdmin()) {
    AureumStore.toast("❌ Acesso negado: apenas o Admin pode excluir contas.");
    return;
  }
  const ok = confirm(
    `Tem certeza que deseja excluir permanentemente a conta de ${lawyerName}?

O advogado perderá o acesso imediatamente e será removido da equipe na tela inicial.`
  );
  if (!ok) return;

  await AureumStore.adminDeleteLawyerAccount(currentAdmin.id, lawyerId);
  await renderAdminLawyersManagement();
  AureumStore.toast(`🗑️ Conta de ${lawyerName} excluída com sucesso.`);
};

// ============================================================================
// 5. PERFIL DO ADVOGADO (FOTO, NOME, OAB, DESCRIÇÃO)
// ============================================================================
function renderProfileAvatarPreview(avatarUrl, name) {
  const wrap = document.getElementById("profile-avatar-preview-wrap");
  if (avatarUrl) {
    wrap.innerHTML = `<img src="${avatarUrl}" alt="${name}" class="lawyer-avatar" style="width:88px; height:88px;" />`;
  } else {
    const initials = (name || "AD").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
    wrap.innerHTML = `<div class="lawyer-avatar" style="width:88px; height:88px;">${initials}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();
  currentAdmin = AureumStore.getSession();
  if (!currentAdmin || (currentAdmin.role !== "admin" && currentAdmin.role !== "lawyer")) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("admin-sidebar-name").textContent = currentAdmin.name;
  document.getElementById("admin-sidebar-oab").textContent = currentAdmin.oab || window.AUREUM_CONFIG.lawyerOab;

  const roleBadge = document.getElementById("admin-role-badge");
  const sidebarPerfilBtn = document.getElementById("sidebar-btn-perfil");
  const workspaceTitle = document.getElementById("workspace-main-title");
  const sidebarSubtitle = document.getElementById("sidebar-panel-subtitle");

  // Controle rigoroso de permissões: APENAS role === 'admin' vê Chave Secreta e Gestão de Advogados
  if (isMasterAdmin()) {
    roleBadge.textContent = "ADMIN MASTER";
    roleBadge.className = "badge badge-gold";
    sidebarPerfilBtn.textContent = "👤 Perfil, Chave & Equipe";
    workspaceTitle.textContent = "Central do Administrador";
    sidebarSubtitle.textContent = "Painel Administrativo";
    document.getElementById("admin-only-lawyers-card").style.display = "block";
    document.getElementById("admin-only-security-card").style.display = "block";
  } else {
    roleBadge.textContent = "ADVOGADO";
    roleBadge.className = "badge badge-info";
    sidebarPerfilBtn.textContent = "👤 Meu Perfil";
    workspaceTitle.textContent = "Central do Advogado";
    sidebarSubtitle.textContent = "Painel do Advogado";
    // Garante que advogado comum não tenha acesso à chave nem à gestão de equipe
    const secCard = document.getElementById("admin-only-security-card");
    const lawCard = document.getElementById("admin-only-lawyers-card");
    if (secCard) secCard.remove();
    if (lawCard) lawCard.remove();
  }

  if (AureumStore.isSupabaseReady()) {
    const badge = document.getElementById("db-connection-badge");
    badge.className = "badge badge-success";
    badge.textContent = "🟢 Conectado ao Supabase";
  }

  document.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchAdminTab(btn.getAttribute("data-tab")));
  });

  // Chat listeners
  document.getElementById("chat-search-client").addEventListener("input", renderAdminChatContacts);
  document.getElementById("chat-filter-lawyer").addEventListener("change", renderAdminChatContacts);

  const adminFileInput = document.getElementById("admin-chat-file");
  const adminFilePreview = document.getElementById("admin-file-preview");
  adminFileInput.addEventListener("change", () => {
    if (adminFileInput.files && adminFileInput.files[0]) {
      adminFilePreview.style.display = "block";
      adminFilePreview.textContent = `📎 PDF: ${adminFileInput.files[0].name}`;
    } else {
      adminFilePreview.style.display = "none";
    }
  });

  document.getElementById("admin-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;
    const input = document.getElementById("admin-chat-input");
    const fileObj = adminFileInput.files && adminFileInput.files[0] ? adminFileInput.files[0] : null;
    const text = input.value.trim() || (fileObj ? `Enviei o arquivo: ${fileObj.name}` : "");
    if (!text && !fileObj) return;

    const msgs = await AureumStore.getMessages();
    const ref = msgs.find((m) => m.client_id === selectedClientId);

    await AureumStore.sendChatMessage(
      {
        client_id: selectedClientId,
        client_name: ref ? ref.client_name : "Cliente",
        client_email: ref ? ref.client_email : "",
        lawyer_id: currentAdmin.id,
        lawyer_name: currentAdmin.name,
        sender_role: currentAdmin.role,
        sender_name: currentAdmin.name,
        text
      },
      fileObj
    );
    input.value = "";
    adminFileInput.value = "";
    adminFilePreview.style.display = "none";
    await renderAdminChatContacts();
    await renderAdminActiveMessages();
    await renderAdminDocs();
    AureumStore.toast("Resposta enviada!");
  });

  // Calendário & Horários
  document.getElementById("cal-prev-month").addEventListener("click", async () => {
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    await renderAdminCalendar();
  });
  document.getElementById("cal-next-month").addEventListener("click", async () => {
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    await renderAdminCalendar();
  });

  document.getElementById("aapt-date").value = selectedCalDate;
  document.getElementById("admin-new-apt-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const dateVal = document.getElementById("aapt-date").value;
    await AureumStore.saveAppointment({
      id: "apt-" + Date.now(),
      client_name: document.getElementById("aapt-client").value.trim(),
      client_email: "agenda@escritorio.com",
      lawyer_id: currentAdmin.id,
      lawyer_name: currentAdmin.name,
      type: "Audiência / Reunião",
      modality: "Presencial / Online",
      date: dateVal,
      time: document.getElementById("aapt-time").value,
      subject: document.getElementById("aapt-subject").value.trim(),
      status: "Confirmado"
    });
    selectedCalDate = dateVal;
    e.target.reset();
    document.getElementById("aapt-date").value = selectedCalDate;
    await renderAdminCalendar();
    AureumStore.toast("Compromisso salvo!");
  });

  const bh = AureumStore.getBusinessHours();
  document.getElementById("bh-open").value = bh.openTime;
  document.getElementById("bh-close").value = bh.closeTime;
  document.getElementById("bh-lunch-start").value = bh.lunchStart;
  document.getElementById("bh-lunch-end").value = bh.lunchEnd;
  document.getElementById("bh-slot").value = String(bh.slotMinutes || 60);
  document.querySelectorAll('input[name="bh-day"]').forEach((cb) => {
    cb.checked = (bh.workingDays || [1, 2, 3, 4, 5]).includes(Number(cb.value));
  });

  document.getElementById("business-hours-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const workingDays = Array.from(document.querySelectorAll('input[name="bh-day"]:checked')).map((c) => Number(c.value));
    await AureumStore.saveBusinessHours({
      openTime: document.getElementById("bh-open").value,
      closeTime: document.getElementById("bh-close").value,
      lunchStart: document.getElementById("bh-lunch-start").value,
      lunchEnd: document.getElementById("bh-lunch-end").value,
      slotMinutes: Number(document.getElementById("bh-slot").value),
      workingDays,
      blockedDates: []
    });
    AureumStore.toast("🕒 Horários de funcionamento atualizados!");
  });

  // Casos
  document.getElementById("admin-new-case-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await AureumStore.saveCase({
      id: "case-" + Date.now(),
      cnj: document.getElementById("ncase-cnj").value.trim(),
      title: document.getElementById("ncase-title").value.trim(),
      area: document.getElementById("ncase-area").value.trim(),
      client_name: document.getElementById("ncase-client-name").value.trim(),
      client_email: document.getElementById("ncase-client-email").value.trim(),
      lawyer_id: currentAdmin.id,
      lawyer_name: currentAdmin.name,
      court: document.getElementById("ncase-court").value.trim(),
      status: "Em Andamento",
      archived: false,
      updates: []
    });
    e.target.reset();
    await renderAdminCases();
    await updateAdminKpis();
    AureumStore.toast("Novo caso cadastrado!");
  });

  document.getElementById("filter-cases-open").addEventListener("click", async () => {
    showArchivedCases = false;
    document.getElementById("filter-cases-open").className = "btn btn-gold btn-sm";
    document.getElementById("filter-cases-archived").className = "btn btn-outline btn-sm";
    await renderAdminCases();
  });
  document.getElementById("filter-cases-archived").addEventListener("click", async () => {
    showArchivedCases = true;
    document.getElementById("filter-cases-archived").className = "btn btn-gold btn-sm";
    document.getElementById("filter-cases-open").className = "btn btn-outline btn-sm";
    await renderAdminCases();
  });

  // Perfil do Advogado/Admin (Foto, Nome, OAB, Descrição -> Tela Inicial)
  AureumValidators.bindOABInput(document.getElementById("prof-oab"), document.getElementById("prof-oab-hint"));
  document.getElementById("prof-name").value = currentAdmin.name || "";
  document.getElementById("prof-oab").value = currentAdmin.oab || "";
  document.getElementById("prof-specialty").value = currentAdmin.specialty || "";
  document.getElementById("prof-phone").value = currentAdmin.phone || "";
  document.getElementById("prof-bio").value = currentAdmin.bio || "";
  document.getElementById("prof-avatar-url").value = currentAdmin.avatar_url || "";
  renderProfileAvatarPreview(currentAdmin.avatar_url, currentAdmin.name);

  document.getElementById("prof-avatar-url").addEventListener("input", (e) => {
    renderProfileAvatarPreview(e.target.value.trim(), document.getElementById("prof-name").value);
  });

  document.getElementById("admin-profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const oabRes = AureumValidators.validateOAB(document.getElementById("prof-oab").value);
    if (!oabRes.valid) {
      AureumStore.toast(`❌ ${oabRes.message}`);
      return;
    }

    let avatarUrl = document.getElementById("prof-avatar-url").value.trim();
    const avatarFile = document.getElementById("prof-avatar-file").files[0];
    if (avatarFile) {
      avatarUrl = await AureumStore.uploadFileToStorage(avatarFile);
    }

    const updated = {
      ...currentAdmin,
      name: document.getElementById("prof-name").value.trim(),
      oab: oabRes.normalized,
      specialty: document.getElementById("prof-specialty").value.trim(),
      phone: document.getElementById("prof-phone").value.trim(),
      bio: document.getElementById("prof-bio").value.trim(),
      avatar_url: avatarUrl
    };

    await AureumStore.saveUser(updated);
    currentAdmin = updated;
    document.getElementById("admin-sidebar-name").textContent = updated.name;
    document.getElementById("admin-sidebar-oab").textContent = updated.oab;
    renderProfileAvatarPreview(updated.avatar_url, updated.name);
    AureumStore.toast("✅ Seu perfil foi atualizado e já está visível na tela inicial!");
  });

  // Inicializa seção exclusiva da conta Admin (Chave Secreta + Gestão de Advogados)
  if (isMasterAdmin()) {
    document.getElementById("sec-invite-code").value = window.AUREUM_CONFIG.adminInviteCode;
    document.getElementById("sec-firm-name").value = window.AUREUM_CONFIG.firmName;
    document.getElementById("sec-short-name").value = window.AUREUM_CONFIG.firmShortName;
    document.getElementById("sec-email").value = window.AUREUM_CONFIG.lawyerEmail;
    document.getElementById("sec-phone").value = window.AUREUM_CONFIG.lawyerPhone;
    document.getElementById("sec-address").value = window.AUREUM_CONFIG.firmAddress;

    document.getElementById("admin-security-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isMasterAdmin()) return;
      const newCode = document.getElementById("sec-invite-code").value.trim();
      if (newCode.length < 4) {
        AureumStore.toast("⚠️ A chave secreta deve ter pelo menos 4 caracteres.");
        return;
      }
      await AureumStore.saveOfficeSettings({
        adminInviteCode: newCode,
        firmName: document.getElementById("sec-firm-name").value.trim(),
        firmShortName: document.getElementById("sec-short-name").value.trim(),
        lawyerEmail: document.getElementById("sec-email").value.trim(),
        lawyerPhone: document.getElementById("sec-phone").value.trim(),
        firmAddress: document.getElementById("sec-address").value.trim()
      });
      await window.loadRuntimeConfig();
      AureumStore.toast("🔐 Chave secreta e dados do escritório atualizados!");
    });

    await renderAdminLawyersManagement();
  }

  await renderAdminChatContacts();
  await renderAdminActiveMessages();
  await renderAdminCalendar();
  await renderAdminCases();
  await renderAdminDocs();
  await renderAdminReviews();
  await updateAdminKpis();
});
