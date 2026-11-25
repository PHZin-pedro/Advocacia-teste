window.closeMobileMenu = function () {
  const drawer = document.getElementById("mobile-drawer");
  if (drawer) drawer.classList.remove("open");
};

window.chooseLawyerForCase = function (lawyerId) {
  const sel = document.getElementById("pub-lawyer-select");
  if (sel) sel.value = lawyerId;
  const bookSel = document.getElementById("book-lawyer-select");
  if (bookSel) bookSel.value = lawyerId;
  document.getElementById("atendimento").scrollIntoView({ behavior: "smooth" });
  AureumStore.toast("⚖️ Advogado selecionado! Preencha os detalhes do seu caso abaixo.");
};

async function renderLawyersSection() {
  const lawyers = await AureumStore.getLawyers();
  const grid = document.getElementById("public-lawyers-grid");
  const selects = [
    document.getElementById("pub-lawyer-select"),
    document.getElementById("book-lawyer-select"),
    document.getElementById("rev-lawyer-select")
  ];

  selects.forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = lawyers
      .map((l) => `<option value="${l.id}">${l.name} (${l.oab || "Advogado"}) — ${l.specialty || "Consultoria Jurídica"}</option>`)
      .join("");
  });

  if (!grid) return;
  grid.innerHTML = lawyers
    .map((l) => {
      const initials = l.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      const avatarHtml = l.avatar_url
        ? `<img src="${l.avatar_url}" alt="${l.name}" class="lawyer-avatar" />`
        : `<div class="lawyer-avatar">${initials}</div>`;

      return `
        <div class="card lawyer-card">
          <div>
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
              ${avatarHtml}
              <div>
                <h3 style="font-family: var(--font-serif); font-size: 1.45rem; line-height: 1.15;">${l.name}</h3>
                <div style="color: var(--gold-500); font-weight: 700; font-size: 0.84rem;">${l.oab || "OAB Ativa"}</div>
                <span class="badge badge-gold" style="margin-top: 4px;">${l.specialty || "Advocacia Estratégica"}</span>
              </div>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              ${l.bio || "Atendimento jurídico personalizado com foco em agilidade, transparência e defesa técnica."}
            </p>
          </div>
          <button type="button" class="btn btn-outline" style="width: 100%; border-color: var(--gold-500);" onclick="chooseLawyerForCase('${l.id}')">
            💬 Falar com ${l.name.split(" ")[0]}
          </button>
        </div>`;
    })
    .join("");
}

async function renderReviewsSection() {
  const reviews = await AureumStore.getReviews();
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / total).toFixed(1) : "5.0";

  document.getElementById("hero-rating-score").textContent = `${avg} ★`;
  document.getElementById("hero-rating-count").textContent = `${total} avaliação(ões)`;
  document.getElementById("reviews-avg-big").textContent = avg;
  document.getElementById("reviews-total-label").textContent = `Baseado em ${total} avaliação(ões) de clientes`;

  // Barras de distribuição 5★ a 1★
  const breakdown = document.getElementById("reviews-breakdown");
  breakdown.innerHTML = [5, 4, 3, 2, 1]
    .map((star) => {
      const count = reviews.filter((r) => Number(r.rating) === star).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.8rem; margin-bottom: 4px;">
          <span style="width: 34px; font-weight: 700;">${star} ★</span>
          <div style="flex: 1; height: 8px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: var(--gold-gradient);"></div>
          </div>
          <span style="width: 32px; text-align: right; color: var(--text-muted);">${count}</span>
        </div>`;
    })
    .join("");

  const grid = document.getElementById("public-reviews-grid");
  grid.innerHTML = reviews
    .map((r) => {
      const stars = "★".repeat(Number(r.rating || 5)) + "☆".repeat(5 - Number(r.rating || 5));
      const dateStr = new Date(r.created_at).toLocaleDateString("pt-BR");
      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
            <div>
              <strong style="display: block; font-size: 1rem;">${r.client_name}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted);">Atendido por <strong>${r.lawyer_name}</strong> • ${r.area || "Consultoria"}</span>
            </div>
            <div style="text-align: right;">
              <div class="stars-display">${stars}</div>
              <span style="font-size: 0.74rem; color: var(--text-muted);">${dateStr}</span>
            </div>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">"${r.comment}"</p>
          ${r.reply
            ? `<div style="margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: var(--gold-soft); border-left: 3px solid var(--gold-500); font-size: 0.84rem;">
                 <strong style="color: var(--gold-600);">Resposta de ${r.lawyer_name}:</strong> ${r.reply}
               </div>`
            : ""}
        </div>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();

  // Menu mobile toggle
  const menuBtn = document.getElementById("mobile-menu-toggle");
  const drawer = document.getElementById("mobile-drawer");
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => drawer.classList.toggle("open"));
  }

  // Máscara e validação rigorosa de CPF (máx 11 dígitos)
  AureumValidators.bindCPFInput(
    document.getElementById("pub-cpf"),
    document.getElementById("pub-cpf-hint")
  );

  // Máscara de telefone
  ["pub-phone", "book-phone"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => { el.value = AureumValidators.maskPhone(el.value); });
  });

  await renderLawyersSection();
  await renderReviewsSection();

  // Estrelas interativas na avaliação pública
  const starBtns = document.querySelectorAll("#public-star-picker .star-btn");
  const ratingInput = document.getElementById("rev-rating");
  starBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-star"));
      ratingInput.value = String(val);
      starBtns.forEach((b) => {
        b.classList.toggle("active", Number(b.getAttribute("data-star")) <= val);
      });
    });
  });

  // Envio de avaliação
  document.getElementById("public-review-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const lawyerSel = document.getElementById("rev-lawyer-select");
    const lawyers = await AureumStore.getLawyers();
    const chosenLawyer = lawyers.find((l) => l.id === lawyerSel.value) || lawyers[0];

    await AureumStore.saveReview({
      id: "rev-" + Date.now(),
      client_name: document.getElementById("rev-name").value.trim(),
      lawyer_id: chosenLawyer ? chosenLawyer.id : "admin-1",
      lawyer_name: chosenLawyer ? chosenLawyer.name : window.AUREUM_CONFIG.lawyerName,
      area: document.getElementById("rev-area").value.trim() || "Atendimento Jurídico",
      rating: Number(ratingInput.value || 5),
      comment: document.getElementById("rev-comment").value.trim(),
      reply: "",
      featured: true,
      created_at: new Date().toISOString()
    });

    e.target.reset();
    ratingInput.value = "5";
    starBtns.forEach((b) => b.classList.add("active"));
    await renderReviewsSection();
    AureumStore.toast("⭐ Obrigado! Sua avaliação foi publicada com sucesso.");
  });

  // Agenda sincronizada por advogado e data
  const dateInput = document.getElementById("book-date");
  const timeSelect = document.getElementById("book-time");
  const bookLawyerSelect = document.getElementById("book-lawyer-select");
  dateInput.min = new Date().toISOString().split("T")[0];

  async function refreshAvailableTimes() {
    if (!dateInput.value) return;
    const slots = await AureumStore.getAvailableSlotsForDate(dateInput.value, bookLawyerSelect.value);
    timeSelect.innerHTML =
      slots.length === 0
        ? `<option value="">Sem horários livres nesta data</option>`
        : slots.map((s) => `<option value="${s}">${s}</option>`).join("");
  }

  dateInput.addEventListener("change", refreshAvailableTimes);
  bookLawyerSelect.addEventListener("change", refreshAvailableTimes);

  // Envio de caso + CPF verificado + advogado selecionado + PDF
  document.getElementById("public-case-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cpfCheck = AureumValidators.validateCPF(document.getElementById("pub-cpf").value);
    if (!cpfCheck.valid) {
      AureumStore.toast(`❌ ${cpfCheck.message}`);
      document.getElementById("pub-cpf").focus();
      return;
    }

    const lawyers = await AureumStore.getLawyers();
    const chosenLawyerId = document.getElementById("pub-lawyer-select").value;
    const chosenLawyer = lawyers.find((l) => l.id === chosenLawyerId) || lawyers[0];

    const name = document.getElementById("pub-name").value.trim();
    const email = document.getElementById("pub-email").value.trim();
    const phone = document.getElementById("pub-phone").value.trim();
    const area = document.getElementById("pub-area").value;
    const message = document.getElementById("pub-message").value.trim();
    const fileInput = document.getElementById("pub-file");
    const fileObj = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    const clientId = "lead-" + email.toLowerCase().replace(/[^a-z0-9]/g, "");

    await AureumStore.saveUser({
      id: clientId,
      name,
      email,
      password: "123",
      role: "client",
      cpf_cnpj: cpfCheck.formatted,
      phone,
      verified: true
    });

    await AureumStore.sendChatMessage(
      {
        client_id: clientId,
        client_name: name,
        client_email: email,
        client_phone: phone,
        lawyer_id: chosenLawyer ? chosenLawyer.id : "admin-1",
        lawyer_name: chosenLawyer ? chosenLawyer.name : window.AUREUM_CONFIG.lawyerName,
        sender_role: "client",
        sender_name: name,
        text: `[CPF: ${cpfCheck.formatted} | Área: ${area}] ${message}`
      },
      fileObj
    );

    e.target.reset();
    document.getElementById("pub-cpf-hint").textContent = "";
    AureumStore.toast(`✅ Enviado diretamente para ${chosenLawyer ? chosenLawyer.name : "o advogado"}!`);
  });

  // Agendamento público
  document.getElementById("public-booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!timeSelect.value) {
      AureumStore.toast("⚠️ Selecione uma data com horário livre.");
      return;
    }
    const lawyers = await AureumStore.getLawyers();
    const chosenLawyer = lawyers.find((l) => l.id === bookLawyerSelect.value) || lawyers[0];

    await AureumStore.saveAppointment({
      id: "apt-" + Date.now(),
      client_name: document.getElementById("book-name").value.trim(),
      client_email: document.getElementById("book-email").value.trim(),
      client_phone: document.getElementById("book-phone").value.trim(),
      lawyer_id: chosenLawyer ? chosenLawyer.id : "admin-1",
      lawyer_name: chosenLawyer ? chosenLawyer.name : window.AUREUM_CONFIG.lawyerName,
      type: "Consulta Inicial",
      modality: document.getElementById("book-modality").value,
      date: dateInput.value,
      time: timeSelect.value,
      subject: document.getElementById("book-subject").value.trim(),
      status: "Confirmado"
    });

    e.target.reset();
    timeSelect.innerHTML = `<option value="">Selecione uma data primeiro</option>`;
    AureumStore.toast("📅 Horário confirmado na agenda do advogado!");
  });
});
