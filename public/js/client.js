let currentClient = null;

function switchClientTab(tab) {
  document.querySelectorAll(".sidebar-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tab-${tab}`);
  });
}

async function populateLawyerDropdowns() {
  const lawyers = await AureumStore.getLawyers();
  const optionsHtml = lawyers
    .map((l) => `<option value="${l.id}">${l.name} (${l.oab || "Advogado"}) — ${l.specialty || "Consultoria"}</option>`)
    .join("");

  ["client-chat-lawyer-select", "capt-lawyer", "crev-lawyer"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = optionsHtml;
  });
}

async function renderClientChat() {
  const allMsgs = await AureumStore.getMessages();
  const mine = allMsgs.filter(
    (m) => m.client_id === currentClient.id || m.client_email.toLowerCase() === currentClient.email.toLowerCase()
  );
  const box = document.getElementById("client-chat-messages");

  if (mine.length === 0) {
    box.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin:auto;">Selecione o advogado acima e envie sua primeira mensagem ou PDF.</div>`;
    return;
  }

  box.innerHTML = mine
    .map((m) => {
      const isOut = m.sender_role === "client";
      const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const attachmentHtml = m.attachment_name
        ? `<div class="msg-attachment">
             <div><strong>📄 ${m.attachment_name}</strong><div style="font-size:0.74rem; color:var(--text-muted);">${m.attachment_size || "PDF"}</div></div>
             ${m.attachment_url && m.attachment_url !== "#documento-demonstrativo"
               ? `<a href="${m.attachment_url}" download="${m.attachment_name}" class="btn btn-outline btn-sm">Baixar</a>`
               : `<span class="badge badge-gold">Anexado</span>`}
           </div>`
        : "";
      return `
        <div class="msg-bubble ${isOut ? "outgoing" : "incoming"}">
          <div style="font-size:0.74rem; font-weight:700; color:var(--gold-500); margin-bottom:3px;">
            ${isOut ? `Você → ${m.lawyer_name || "Advogado"}` : m.sender_name}
          </div>
          <div>${m.text}</div>
          ${attachmentHtml}
          <div class="msg-meta"><span>${time}</span><span>${isOut ? "✓✓ Enviado" : "Advogado"}</span></div>
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
    container.innerHTML = `<div class="card"><p style="color:var(--text-secondary);">Nenhum processo vinculado ainda.</p></div>`;
    return;
  }
  container.innerHTML = mine
    .map((c) => `
      <div class="card">
        <span class="badge badge-gold">${c.area}</span>
        <h3 style="margin-top:6px;">${c.title}</h3>
        <div style="font-size:0.84rem; color:var(--text-muted); margin-bottom:10px;">
          CNJ: <strong>${c.cnj}</strong> • Advogado: <strong>${c.lawyer_name || "Equipe"}</strong> • ${c.court}
        </div>
        ${(c.updates || []).map((u) => `
          <div style="padding:10px; background:var(--bg-elevated); border-radius:8px; margin-top:8px; font-size:0.85rem;">
            <strong>${u.date} — ${u.title}</strong>
            <div style="color:var(--text-secondary);">${u.description}</div>
          </div>`).join("")}
      </div>`)
    .join("");
}

async function renderClientDocs() {
  const docs = await AureumStore.getDocuments();
  const mine = docs.filter(
    (d) => d.client_id === currentClient.id || (d.client_email || "").toLowerCase() === currentClient.email.toLowerCase()
  );
  document.getElementById("client-docs-tbody").innerHTML =
    mine.length === 0
      ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum documento enviado.</td></tr>`
      : mine.map((d) => `
        <tr>
          <td><strong>${d.title}</strong></td>
          <td>${d.file_name}</td>
          <td>${d.uploaded_at}</td>
          <td><span class="badge ${d.status === "Aprovado" ? "badge-success" : "badge-warning"}">${d.status}</span></td>
          <td>${d.file_url && d.file_url !== "#documento-demonstrativo" ? `<a href="${d.file_url}" download="${d.file_name}" class="btn btn-outline btn-sm">Baixar</a>` : "Enviado"}</td>
        </tr>`).join("");
}

async function renderClientAppointments() {
  const apts = await AureumStore.getAppointments();
  const mine = apts.filter(
    (a) => a.client_id === currentClient.id || (a.client_email || "").toLowerCase() === currentClient.email.toLowerCase()
  );
  document.getElementById("client-apts-list").innerHTML =
    mine.length === 0
      ? `<p style="color:var(--text-muted); font-size:0.86rem;">Sem reuniões agendadas.</p>`
      : mine.map((a) => `
        <div style="padding:12px; border-radius:10px; border:1px solid var(--border-subtle); background:var(--bg-primary);">
          <strong>📅 ${a.date} às ${a.time} — ${a.lawyer_name || "Advogado"}</strong>
          <div style="font-size:0.86rem;">${a.subject} (${a.modality})</div>
        </div>`).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();
  currentClient = AureumStore.getSession();
  if (!currentClient) { window.location.href = "/login.html"; return; }

  document.getElementById("client-sidebar-name").textContent = currentClient.name;
  document.getElementById("client-sidebar-email").textContent = currentClient.email;

  document.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchClientTab(btn.getAttribute("data-tab")));
  });

  await populateLawyerDropdowns();

  const chatFileInput = document.getElementById("client-chat-file");
  const filePreview = document.getElementById("client-file-preview");
  chatFileInput.addEventListener("change", () => {
    if (chatFileInput.files && chatFileInput.files[0]) {
      filePreview.style.display = "block";
      filePreview.textContent = `📎 Anexo: ${chatFileInput.files[0].name}`;
    } else {
      filePreview.style.display = "none";
    }
  });

  document.getElementById("client-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("client-chat-input");
    const fileObj = chatFileInput.files && chatFileInput.files[0] ? chatFileInput.files[0] : null;
    const text = input.value.trim() || (fileObj ? `Enviei o documento: ${fileObj.name}` : "");
    if (!text && !fileObj) return;

    const lawyers = await AureumStore.getLawyers();
    const chosen = lawyers.find((l) => l.id === document.getElementById("client-chat-lawyer-select").value) || lawyers[0];

    await AureumStore.sendChatMessage(
      {
        client_id: currentClient.id,
        client_name: currentClient.name,
        client_email: currentClient.email,
        client_phone: currentClient.phone || "",
        lawyer_id: chosen ? chosen.id : "admin-1",
        lawyer_name: chosen ? chosen.name : window.AUREUM_CONFIG.lawyerName,
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
    AureumStore.toast("Mensagem enviada!");
  });

  document.getElementById("client-doc-upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("cdoc-title").value.trim();
    const fileObj = document.getElementById("cdoc-file").files[0];
    if (!fileObj) return;
    await AureumStore.sendChatMessage(
      {
        client_id: currentClient.id,
        client_name: currentClient.name,
        client_email: currentClient.email,
        sender_role: "client",
        sender_name: currentClient.name,
        text: `Enviei o documento "${title}" para análise.`
      },
      fileObj
    );
    e.target.reset();
    await renderClientDocs();
    await renderClientChat();
    AureumStore.toast("📄 Documento enviado!");
  });

  const captDate = document.getElementById("capt-date");
  const captTime = document.getElementById("capt-time");
  const captLawyer = document.getElementById("capt-lawyer");
  captDate.min = new Date().toISOString().split("T")[0];

  async function refreshTimes() {
    if (!captDate.value) return;
    const slots = await AureumStore.getAvailableSlotsForDate(captDate.value, captLawyer.value);
    captTime.innerHTML = slots.length === 0 ? `<option value="">Sem horários</option>` : slots.map((s) => `<option value="${s}">${s}</option>`).join("");
  }
  captDate.addEventListener("change", refreshTimes);
  captLawyer.addEventListener("change", refreshTimes);

  document.getElementById("client-apt-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!captTime.value) { AureumStore.toast("⚠️ Escolha uma data com horário livre."); return; }
    const lawyers = await AureumStore.getLawyers();
    const chosen = lawyers.find((l) => l.id === captLawyer.value) || lawyers[0];
    await AureumStore.saveAppointment({
      id: "apt-" + Date.now(),
      client_id: currentClient.id,
      client_name: currentClient.name,
      client_email: currentClient.email,
      lawyer_id: chosen ? chosen.id : "admin-1",
      lawyer_name: chosen ? chosen.name : window.AUREUM_CONFIG.lawyerName,
      type: "Reunião Cliente",
      modality: document.getElementById("capt-modality").value,
      date: captDate.value,
      time: captTime.value,
      subject: document.getElementById("capt-subject").value.trim(),
      status: "Confirmado"
    });
    e.target.reset();
    await renderClientAppointments();
    AureumStore.toast("📅 Reunião agendada!");
  });

  // Avaliação pelo portal do cliente
  const starBtns = document.querySelectorAll("#client-star-picker .star-btn");
  const ratingInput = document.getElementById("crev-rating");
  starBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-star"));
      ratingInput.value = String(val);
      starBtns.forEach((b) => b.classList.toggle("active", Number(b.getAttribute("data-star")) <= val));
    });
  });

  document.getElementById("client-review-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const lawyers = await AureumStore.getLawyers();
    const chosen = lawyers.find((l) => l.id === document.getElementById("crev-lawyer").value) || lawyers[0];
    await AureumStore.saveReview({
      id: "rev-" + Date.now(),
      client_name: currentClient.name,
      client_email: currentClient.email,
      lawyer_id: chosen ? chosen.id : "admin-1",
      lawyer_name: chosen ? chosen.name : window.AUREUM_CONFIG.lawyerName,
      area: "Cliente Verificado",
      rating: Number(ratingInput.value || 5),
      comment: document.getElementById("crev-comment").value.trim(),
      reply: "",
      featured: true,
      created_at: new Date().toISOString()
    });
    e.target.reset();
    AureumStore.toast("⭐ Avaliação publicada na página inicial!");
  });

  await renderClientChat();
  await renderClientCases();
  await renderClientDocs();
  await renderClientAppointments();
});
