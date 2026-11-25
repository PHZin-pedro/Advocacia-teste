let selectedClientId = null;
let showArchivedCases = false;
let calendarCursor = new Date();
let selectedCalDate = new Date().toISOString().split("T")[0];

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
  const apts = await AureumStore.getAppointments();
  const msgs = await AureumStore.getMessages();

  document.getElementById("kpi-open-cases").textContent = cases.filter((c) => !c.archived).length;
  document.getElementById("kpi-archived-cases").textContent = cases.filter((c) => c.archived).length;
  document.getElementById("kpi-docs-count").textContent = docs.length;
  document.getElementById("kpi-apts-count").textContent = apts.length;

  const unread = msgs.filter((m) => m.sender_role === "client" && !m.read_by_admin).length;
  document.getElementById("badge-unread-chat").textContent = unread;
}

// ============================================================================
// 1. CHAT ESTILO WHATSAPP DO ADVOGADO (NOME, E-MAIL, PDFS & RESPOSTA)
// ============================================================================
async function renderAdminChatContacts() {
  const msgs = await AureumStore.getMessages();
  const search = (document.getElementById("chat-search-client").value || "").toLowerCase();

  // Agrupa mensagens por cliente
  const threadsMap = new Map();
  msgs.forEach((m) => {
    const existing = threadsMap.get(m.client_id) || {
      client_id: m.client_id,
      client_name: m.client_name,
      client_email: m.client_email,
      client_phone: m.client_phone || "",
      lastMessage: m.text,
      lastTime: m.created_at,
      unread: 0,
      pdfCount: 0
    };
    existing.lastMessage = m.attachment_name ? `📄 ${m.attachment_name}` : m.text;
    existing.lastTime = m.created_at;
    if (m.sender_role === "client" && !m.read_by_admin) existing.unread += 1;
    if (m.attachment_name) existing.pdfCount += 1;
    threadsMap.set(m.client_id, existing);
  });

  let threads = Array.from(threadsMap.values()).filter(
    (t) =>
      t.client_name.toLowerCase().includes(search) ||
      t.client_email.toLowerCase().includes(search)
  );

  if (!selectedClientId && threads.length > 0) {
    selectedClientId = threads[0].client_id;
  }

  const listEl = document.getElementById("admin-chat-contact-list");
  if (threads.length === 0) {
    listEl.innerHTML = `<div style="padding: 18px; color: var(--text-muted); font-size: 0.86rem;">Nenhuma conversa encontrada.</div>`;
    return;
  }

  listEl.innerHTML = threads
    .map(
      (t) => `
      <div class="chat-contact-item ${t.client_id === selectedClientId ? "active" : ""}" onclick="selectChatThread('${t.client_id}')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.92rem;">${t.client_name}</strong>
          ${t.unread > 0 ? `<span class="badge badge-gold">${t.unread} nova</span>` : ""}
        </div>
        <div style="font-size: 0.76rem; color: var(--gold-500); font-weight: 600;">${t.client_email}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${t.lastMessage}
        </div>
        ${t.pdfCount > 0 ? `<span style="font-size: 0.72rem; color: var(--text-muted);">📎 ${t.pdfCount} documento(s) anexado(s)</span>` : ""}
      </div>`
    )
    .join("");
}

window.selectChatThread = async function (clientId) {
  selectedClientId = clientId;
  await AureumStore.markThreadRead(clientId, "admin");
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
    document.getElementById("active-chat-client-meta").textContent = "Os dados do cliente e PDFs enviados aparecerão aqui";
    box.innerHTML = "";
    return;
  }

  const head = threadMsgs[0];
  document.getElementById("active-chat-client-name").textContent = head.client_name;
  document.getElementById("active-chat-client-meta").textContent =
    `📧 ${head.client_email} ${head.client_phone ? "• 📱 " + head.client_phone : ""}`;

  box.innerHTML = threadMsgs
    .map((m) => {
      const isOut = m.sender_role === "admin";
      const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const attachmentHtml = m.attachment_name
        ? `<div class="msg-attachment">
             <div>
               <strong>📄 ${m.attachment_name}</strong>
               <div style="font-size: 0.74rem; color: var(--text-muted);">${m.attachment_size || "Arquivo PDF"}</div>
             </div>
             ${m.attachment_url && m.attachment_url !== "#documento-demonstrativo"
               ? `<a href="${m.attachment_url}" download="${m.attachment_name}" class="btn btn-gold btn-sm">Abrir / Baixar PDF</a>`
               : `<span class="badge badge-gold">PDF Recebido</span>`}
           </div>`
        : "";

      return `
        <div class="msg-bubble ${isOut ? "outgoing" : "incoming"}">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--gold-500); margin-bottom: 3px;">
            ${isOut ? "Você (Advogado)" : `${m.client_name} (${m.client_email})`}
          </div>
          <div>${m.text}</div>
          ${attachmentHtml}
          <div class="msg-meta">
            <span>${time}</span>
            <span>${isOut ? "✓✓ Respondido" : "Cliente"}</span>
          </div>
        </div>`;
    })
    .join("");

  box.scrollTop = box.scrollHeight;
}

// ============================================================================
// 2. CALENDÁRIO INTERATIVO DO ADVOGADO & HORÁRIOS DE FUNCIONAMENTO
// ============================================================================
async function renderAdminCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const monthLabel = calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  document.getElementById("cal-month-label").textContent = monthLabel;

  const apts = await AureumStore.getAppointments();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const grid = document.getElementById("admin-calendar-grid");
  let html = "";

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayApts = apts.filter((a) => a.date === dateStr && a.status !== "Cancelado");
    const isSelected = dateStr === selectedCalDate;
    const isToday = dateStr === todayStr;

    html += `
      <div class="cal-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}" onclick="selectCalendarDate('${dateStr}')">
        <span class="cal-day-num">${day}</span>
        <div class="cal-dots">
          ${dayApts.map(() => `<span class="cal-dot"></span>`).join("")}
        </div>
      </div>`;
  }

  grid.innerHTML = html;
  await renderSelectedDayAppointments();
}

window.selectCalendarDate = async function (dateStr) {
  selectedCalDate = dateStr;
  document.getElementById("aapt-date").value = dateStr;
  await renderAdminCalendar();
};

async function renderSelectedDayAppointments() {
  const apts = await AureumStore.getAppointments();
  const dayApts = apts.filter((a) => a.date === selectedCalDate);
  document.getElementById("selected-date-label").textContent = `Data selecionada: ${selectedCalDate}`;

  const listEl = document.getElementById("day-appointments-list");
  if (dayApts.length === 0) {
    listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Nenhuma audiência ou reunião marcada para esta data.</p>`;
    return;
  }

  listEl.innerHTML = dayApts
    .map(
      (a) => `
      <div style="padding: 11px 13px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>⏰ ${a.time} — ${a.client_name}</strong>
          <span class="badge badge-gold">${a.type}</span>
        </div>
        <div style="font-size: 0.85rem; margin-top: 4px;">${a.subject}</div>
        <div style="font-size: 0.76rem; color: var(--text-muted);">${a.modality} ${a.location_or_link ? "• " + a.location_or_link : ""}</div>
      </div>`
    )
    .join("");
}

function loadBusinessHoursForm() {
  const h = AureumStore.getBusinessHours();
  document.getElementById("bh-open").value = h.openTime || "08:00";
  document.getElementById("bh-close").value = h.closeTime || "18:00";
  document.getElementById("bh-lunch-start").value = h.lunchStart || "12:00";
  document.getElementById("bh-lunch-end").value = h.lunchEnd || "13:30";
  document.getElementById("bh-slot").value = String(h.slotMinutes || 60);

  document.querySelectorAll('input[name="bh-day"]').forEach((cb) => {
    cb.checked = (h.workingDays || [1, 2, 3, 4, 5]).includes(Number(cb.value));
  });
}

// ============================================================================
// 3. CASOS EM ABERTO & ARQUIVADOS
// ============================================================================
async function renderAdminCases() {
  const cases = await AureumStore.getCases();
  const filtered = cases.filter((c) => Boolean(c.archived) === showArchivedCases);
  const container = document.getElementById("admin-cases-container");

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card"><p style="color: var(--text-muted);">Nenhum processo ${showArchivedCases ? "arquivado" : "em aberto"} no momento.</p></div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (c) => `
      <div class="card">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
          <div>
            <span class="badge badge-gold">${c.area}</span>
            <h3 style="margin-top: 6px;">${c.title}</h3>
            <div style="font-size: 0.84rem; color: var(--text-secondary);">
              CNJ: <strong>${c.cnj}</strong> • Cliente: <strong>${c.client_name}</strong> (${c.client_email}) • ${c.court}
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <button class="btn btn-outline btn-sm" onclick="addCaseUpdatePrompt('${c.id}')">+ Movimentação</button>
            <button class="btn ${c.archived ? "btn-gold" : "btn-danger"} btn-sm" onclick="toggleArchiveCase('${c.id}')">
              ${c.archived ? "♻️ Reabrir Caso" : "📦 Arquivar Caso"}
            </button>
          </div>
        </div>
        <div style="font-size: 0.84rem; color: var(--text-muted);">
          Última movimentação: ${(c.updates && c.updates[0]) ? `${c.updates[0].date} — ${c.updates[0].title}` : "Nenhuma registrada"}
        </div>
      </div>`
    )
    .join("");
}

window.toggleArchiveCase = async function (caseId) {
  const cases = await AureumStore.getCases();
  const target = cases.find((c) => c.id === caseId);
  if (!target) return;
  target.archived = !target.archived;
  await AureumStore.saveCase(target);
  await renderAdminCases();
  await updateAdminKpis();
  AureumStore.toast(target.archived ? "📦 Caso arquivado com sucesso." : "♻️ Caso reaberto.");
};

window.addCaseUpdatePrompt = async function (caseId) {
  const title = prompt("Título da movimentação processual (ex: Petição Protocolada):");
  if (!title) return;
  const description = prompt("Descrição resumida para o cliente acompanhar:") || "";
  const cases = await AureumStore.getCases();
  const target = cases.find((c) => c.id === caseId);
  if (!target) return;
  target.updates = target.updates || [];
  target.updates.unshift({
    id: "upd-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    title,
    description,
    author: window.AUREUM_CONFIG.lawyerName
  });
  await AureumStore.saveCase(target);
  await renderAdminCases();
  AureumStore.toast("⚖️ Movimentação publicada no portal do cliente!");
};

// ============================================================================
// 4. REPOSITÓRIO GERAL DE DOCUMENTOS
// ============================================================================
async function renderAdminDocs() {
  const docs = await AureumStore.getDocuments();
  const tbody = document.getElementById("admin-docs-tbody");

  tbody.innerHTML =
    docs.length === 0
      ? `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum documento recebido.</td></tr>`
      : docs
          .map(
            (d) => `
          <tr>
            <td>
              <strong>${d.client_name || "Cliente"}</strong>
              <div style="font-size:0.76rem; color:var(--text-muted);">${d.client_email || ""}</div>
            </td>
            <td>${d.title}</td>
            <td>📄 ${d.file_name} (${d.file_size || "PDF"})</td>
            <td>${d.uploaded_at}</td>
            <td><span class="badge ${d.status === "Aprovado" ? "badge-success" : "badge-warning"}">${d.status}</span></td>
            <td style="display:flex; gap:6px;">
              ${d.file_url && d.file_url !== "#documento-demonstrativo"
                ? `<a href="${d.file_url}" download="${d.file_name}" class="btn btn-outline btn-sm">Baixar</a>`
                : ""}
              <button class="btn btn-gold btn-sm" onclick="approveDocument('${d.id}')">✓ Validar</button>
            </td>
          </tr>`
          )
          .join("");
}

window.approveDocument = async function (docId) {
  const docs = await AureumStore.getDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return;
  doc.status = "Aprovado";
  await AureumStore.saveDocument(doc);
  await renderAdminDocs();
  AureumStore.toast("✅ Documento marcado como Aprovado!");
};

// ============================================================================
// INICIALIZAÇÃO DO PAINEL DO ADVOGADO
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();

  const session = AureumStore.getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("admin-sidebar-name").textContent = session.name;
  document.getElementById("admin-sidebar-oab").textContent = session.oab || window.AUREUM_CONFIG.lawyerOab;

  if (AureumStore.isSupabaseReady()) {
    const badge = document.getElementById("db-connection-badge");
    badge.className = "badge badge-success";
    badge.textContent = "🟢 Conectado ao Supabase";
  }

  document.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchAdminTab(btn.getAttribute("data-tab")));
  });

  // Busca no chat
  document.getElementById("chat-search-client").addEventListener("input", renderAdminChatContacts);

  // Anexo no chat admin
  const adminFileInput = document.getElementById("admin-chat-file");
  const adminFilePreview = document.getElementById("admin-file-preview");
  adminFileInput.addEventListener("change", () => {
    if (adminFileInput.files && adminFileInput.files[0]) {
      adminFilePreview.style.display = "block";
      adminFilePreview.textContent = `📎 PDF/Documento anexado: ${adminFileInput.files[0].name}`;
    } else {
      adminFilePreview.style.display = "none";
    }
  });

  // Resposta do Advogado no Chat estilo WhatsApp
  document.getElementById("admin-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      AureumStore.toast("⚠️ Selecione uma conversa primeiro.");
      return;
    }

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
        client_phone: ref ? ref.client_phone : "",
        sender_role: "admin",
        sender_name: session.name,
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
    await updateAdminKpis();
    AureumStore.toast("Resposta enviada ao cliente!");
  });

  // Navegação do Calendário
  document.getElementById("cal-prev-month").addEventListener("click", async () => {
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    await renderAdminCalendar();
  });
  document.getElementById("cal-next-month").addEventListener("click", async () => {
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    await renderAdminCalendar();
  });

  // Novo compromisso manual na agenda
  document.getElementById("aapt-date").value = selectedCalDate;
  document.getElementById("admin-new-apt-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const dateVal = document.getElementById("aapt-date").value;
    await AureumStore.saveAppointment({
      id: "apt-" + Date.now(),
      client_name: document.getElementById("aapt-client").value.trim(),
      client_email: "agenda@escritorio.com",
      type: document.getElementById("aapt-type").value,
      modality: document.getElementById("aapt-modality").value,
      date: dateVal,
      time: document.getElementById("aapt-time").value,
      subject: document.getElementById("aapt-subject").value.trim(),
      status: "Confirmado"
    });
    selectedCalDate = dateVal;
    e.target.reset();
    document.getElementById("aapt-date").value = selectedCalDate;
    await renderAdminCalendar();
    await updateAdminKpis();
    AureumStore.toast("📅 Compromisso salvo no calendário!");
  });

  // Salvar Horários de Funcionamento
  loadBusinessHoursForm();
  document.getElementById("business-hours-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const workingDays = Array.from(document.querySelectorAll('input[name="bh-day"]:checked')).map((cb) =>
      Number(cb.value)
    );
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

  // Novo Processo
  document.getElementById("admin-new-case-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await AureumStore.saveCase({
      id: "case-" + Date.now(),
      cnj: document.getElementById("ncase-cnj").value.trim(),
      title: document.getElementById("ncase-title").value.trim(),
      area: document.getElementById("ncase-area").value.trim(),
      client_id: "lead-" + document.getElementById("ncase-client-email").value.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
      client_name: document.getElementById("ncase-client-name").value.trim(),
      client_email: document.getElementById("ncase-client-email").value.trim(),
      court: document.getElementById("ncase-court").value.trim(),
      phase: "Inicial Protocolada",
      status: "Em Andamento",
      archived: false,
      opened_at: new Date().toISOString().split("T")[0],
      updates: []
    });
    e.target.reset();
    showArchivedCases = false;
    await renderAdminCases();
    await updateAdminKpis();
    AureumStore.toast("⚖️ Novo caso em aberto cadastrado!");
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

  // White-Label Config Form
  document.getElementById("cfg-firm-name").value = window.AUREUM_CONFIG.firmName;
  document.getElementById("cfg-short-name").value = window.AUREUM_CONFIG.firmShortName;
  document.getElementById("cfg-lawyer-name").value = window.AUREUM_CONFIG.lawyerName;
  document.getElementById("cfg-lawyer-oab").value = window.AUREUM_CONFIG.lawyerOab;
  document.getElementById("cfg-lawyer-email").value = window.AUREUM_CONFIG.lawyerEmail;
  document.getElementById("cfg-lawyer-phone").value = window.AUREUM_CONFIG.lawyerPhone;
  document.getElementById("cfg-firm-address").value = window.AUREUM_CONFIG.firmAddress;

  document.getElementById("admin-brand-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const overrides = {
      firmName: document.getElementById("cfg-firm-name").value.trim(),
      firmShortName: document.getElementById("cfg-short-name").value.trim(),
      lawyerName: document.getElementById("cfg-lawyer-name").value.trim(),
      lawyerOab: document.getElementById("cfg-lawyer-oab").value.trim(),
      lawyerEmail: document.getElementById("cfg-lawyer-email").value.trim(),
      lawyerPhone: document.getElementById("cfg-lawyer-phone").value.trim(),
      firmAddress: document.getElementById("cfg-firm-address").value.trim()
    };
    localStorage.setItem("aureum_brand_overrides", JSON.stringify(overrides));
    await window.loadRuntimeConfig();
    AureumStore.toast("⚙️ Dados do escritório atualizados!");
  });

  await renderAdminChatContacts();
  await renderAdminActiveMessages();
  await renderAdminCalendar();
  await renderAdminCases();
  await renderAdminDocs();
  await updateAdminKpis();
});
