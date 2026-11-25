let currentClient = null;

function switchClientTab(tab) {
  document.querySelectorAll(".sidebar-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tab-${tab}`);
  });
}

async function renderClientChat() {
  const allMsgs = await AureumStore.getMessages();
  const mine = allMsgs.filter(
    (m) => m.client_id === currentClient.id || m.client_email.toLowerCase() === currentClient.email.toLowerCase()
  );
  const box = document.getElementById("client-chat-messages");

  if (mine.length === 0) {
    box.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); margin: auto;">
        <p style="font-size: 1rem; font-weight: 600;">Inicie seu atendimento jurídico</p>
        <p style="font-size: 0.85rem;">Escreva sua mensagem abaixo ou clique no clipe (📎) para anexar PDFs.</p>
      </div>`;
    return;
  }

  box.innerHTML = mine
    .map((m) => {
      const isOut = m.sender_role === "client";
      const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const attachmentHtml = m.attachment_name
        ? `<div class="msg-attachment">
             <div>
               <strong>📄 ${m.attachment_name}</strong>
               <div style="font-size: 0.74rem; color: var(--text-muted);">${m.attachment_size || "Documento"}</div>
             </div>
             ${m.attachment_url && m.attachment_url !== "#documento-demonstrativo"
               ? `<a href="${m.attachment_url}" download="${m.attachment_name}" class="btn btn-outline btn-sm">Baixar</a>`
               : `<span class="badge badge-gold">Anexado</span>`}
           </div>`
        : "";

      return `
        <div class="msg-bubble ${isOut ? "outgoing" : "incoming"}">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--gold-500); margin-bottom: 3px;">
            ${m.sender_name}
          </div>
          <div>${m.text}</div>
          ${attachmentHtml}
          <div class="msg-meta">
            <span>${time}</span>
            <span>${isOut ? "✓✓ Enviado" : "Advogado"}</span>
          </div>
        </div>`;
    })
    .join("");

  box.scrollTop = box.scrollHeight;
}

async function renderClientCases() {
  const cases = await AureumStore.getCases();
  const mine = cases.filter(
    (c) => c.client_id === currentClient.id || (c.client_email || "").toLowerCase() === currentClient.email.toLowerCase()
  );
  const container = document.getElementById("client-cases-list");

  if (mine.length === 0) {
    container.innerHTML = `<div class="card"><p style="color: var(--text-secondary);">Nenhum processo cadastrado no seu CPF/E-mail ainda. Envie os detalhes do seu caso pelo chat ao lado.</p></div>`;
    return;
  }

  container.innerHTML = mine
    .map(
      (c) => `
      <div class="card">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
          <div>
            <span class="badge badge-gold">${c.area}</span>
            <h3 style="margin-top: 6px;">${c.title}</h3>
            <div style="font-size: 0.84rem; color: var(--text-muted);">CNJ: <strong>${c.cnj}</strong> • ${c.court}</div>
          </div>
          <div>
            <span class="badge ${c.archived ? "badge-warning" : "badge-success"}">
              ${c.archived ? "Arquivado" : c.status}
            </span>
          </div>
        </div>
        <div style="padding-top: 12px; border-top: 1px solid var(--border-subtle);">
          <strong style="font-size: 0.85rem; display: block; margin-bottom: 8px;">Últimas Movimentações:</strong>
          ${(c.updates || []).length === 0
            ? `<p style="font-size: 0.84rem; color: var(--text-muted);">Aguardando primeira movimentação.</p>`
            : (c.updates || [])
                .map(
                  (u) => `
                <div style="padding: 10px 12px; background: var(--bg-elevated); border-radius: 8px; margin-bottom: 8px; font-size: 0.85rem;">
                  <div style="font-weight: 700;">${u.date} — ${u.title}</div>
                  <div style="color: var(--text-secondary);">${u.description}</div>
                </div>`
                )
                .join("")}
        </div>
      </div>`
    )
    .join("");
}

async function renderClientDocs() {
  const docs = await AureumStore.getDocuments();
  const mine = docs.filter(
    (d) => d.client_id === currentClient.id || (d.client_email || "").toLowerCase() === currentClient.email.toLowerCase()
  );
  const tbody = document.getElementById("client-docs-tbody");
  tbody.innerHTML =
    mine.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhum documento enviado ainda.</td></tr>`
      : mine
          .map(
            (d) => `
          <tr>
            <td><strong>${d.title}</strong></td>
            <td>${d.file_name} (${d.file_size || "PDF"})</td>
            <td>${d.uploaded_at}</td>
            <td><span class="badge ${d.status === "Aprovado" ? "badge-success" : "badge-warning"}">${d.status}</span></td>
            <td>
              ${d.file_url && d.file_url !== "#documento-demonstrativo"
                ? `<a href="${d.file_url}" download="${d.file_name}" class="btn btn-outline btn-sm">Baixar</a>`
                : `<span style="font-size:0.8rem; color:var(--text-muted);">Registrado</span>`}
            </td>
          </tr>`
          )
          .join("");
}

async function renderClientAppointments() {
  const apts = await AureumStore.getAppointments();
  const mine = apts.filter(
    (a) => a.client_id === currentClient.id || (a.client_email || "").toLowerCase() === currentClient.email.toLowerCase()
  );
  const list = document.getElementById("client-apts-list");
  list.innerHTML =
    mine.length === 0
      ? `<p style="color: var(--text-muted); font-size: 0.88rem;">Você ainda não possui reuniões agendadas.</p>`
      : mine
          .map(
            (a) => `
          <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-primary);">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong>📅 ${a.date} às ${a.time}</strong>
              <span class="badge badge-success">${a.status}</span>
            </div>
            <div style="font-size: 0.88rem;">${a.subject}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${a.modality}</div>
          </div>`
          )
          .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();

  currentClient = AureumStore.getSession();
  if (!currentClient) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("client-sidebar-name").textContent = currentClient.name;
  document.getElementById("client-sidebar-email").textContent = currentClient.email;

  document.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchClientTab(btn.getAttribute("data-tab")));
  });

  // Preview de anexo no chat
  const chatFileInput = document.getElementById("client-chat-file");
  const filePreview = document.getElementById("client-file-preview");
  chatFileInput.addEventListener("change", () => {
    if (chatFileInput.files && chatFileInput.files[0]) {
      filePreview.style.display = "block";
      filePreview.textContent = `📎 Arquivo pronto para envio: ${chatFileInput.files[0].name}`;
    } else {
      filePreview.style.display = "none";
    }
  });

  // Envio de mensagem no Chat estilo WhatsApp
  document.getElementById("client-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("client-chat-input");
    const fileObj = chatFileInput.files && chatFileInput.files[0] ? chatFileInput.files[0] : null;
    const text = input.value.trim() || (fileObj ? `Enviei o documento: ${fileObj.name}` : "");
    if (!text && !fileObj) return;

    await AureumStore.sendChatMessage(
      {
        client_id: currentClient.id,
        client_name: currentClient.name,
        client_email: currentClient.email,
        client_phone: currentClient.phone || "",
        sender_role: "client",
        sender_name: currentClient.name,
        text
      },
      fileObj
    );

    input.value = "";
    chatFileInput.value = "";
    filePreview.style.display = "none";
    await renderClientChat();
    await renderClientDocs();
    AureumStore.toast("Mensagem enviada ao advogado!");
  });

  // Upload direto na aba Documentos
  document.getElementById("client-doc-upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("cdoc-title").value.trim();
    const fileInput = document.getElementById("cdoc-file");
    const fileObj = fileInput.files[0];
    if (!fileObj) return;

    await AureumStore.sendChatMessage(
      {
        client_id: currentClient.id,
        client_name: currentClient.name,
        client_email: currentClient.email,
        client_phone: currentClient.phone || "",
        sender_role: "client",
        sender_name: currentClient.name,
        text: `Enviei o documento "${title}" para análise.`
      },
      fileObj
    );

    e.target.reset();
    await renderClientDocs();
    await renderClientChat();
    AureumStore.toast("📄 Documento enviado com sucesso!");
  });

  // Agenda do cliente sincronizada com horários de funcionamento do advogado
  const captDate = document.getElementById("capt-date");
  const captTime = document.getElementById("capt-time");
  captDate.min = new Date().toISOString().split("T")[0];
  captDate.addEventListener("change", async () => {
    const slots = await AureumStore.getAvailableSlotsForDate(captDate.value);
    captTime.innerHTML =
      slots.length === 0
        ? `<option value="">Sem horários disponíveis nesta data</option>`
        : slots.map((s) => `<option value="${s}">${s}</option>`).join("");
  });

  document.getElementById("client-apt-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!captTime.value) {
      AureumStore.toast("⚠️ Escolha uma data com horário livre.");
      return;
    }
    await AureumStore.saveAppointment({
      id: "apt-" + Date.now(),
      client_id: currentClient.id,
      client_name: currentClient.name,
      client_email: currentClient.email,
      client_phone: currentClient.phone || "",
      type: "Reunião Cliente",
      modality: document.getElementById("capt-modality").value,
      date: captDate.value,
      time: captTime.value,
      subject: document.getElementById("capt-subject").value.trim(),
      status: "Confirmado"
    });
    e.target.reset();
    await renderClientAppointments();
    AureumStore.toast("📅 Reunião agendada com sucesso!");
  });

  await renderClientChat();
  await renderClientCases();
  await renderClientDocs();
  await renderClientAppointments();
});
