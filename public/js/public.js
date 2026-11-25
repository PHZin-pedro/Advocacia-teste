document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();

  // Configura data mínima de agendamento para hoje
  const dateInput = document.getElementById("book-date");
  const timeSelect = document.getElementById("book-time");
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.addEventListener("change", async () => {
      const slots = await AureumStore.getAvailableSlotsForDate(dateInput.value);
      if (slots.length === 0) {
        timeSelect.innerHTML = `<option value="">Sem horários livres nesta data</option>`;
      } else {
        timeSelect.innerHTML = slots
          .map((s) => `<option value="${s}">${s}</option>`)
          .join("");
      }
    });
  }

  // Envio de caso + documento diretamente para o chat do advogado
  const caseForm = document.getElementById("public-case-form");
  if (caseForm) {
    caseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("pub-name").value.trim();
      const email = document.getElementById("pub-email").value.trim();
      const phone = document.getElementById("pub-phone").value.trim();
      const area = document.getElementById("pub-area").value;
      const message = document.getElementById("pub-message").value.trim();
      const fileInput = document.getElementById("pub-file");
      const fileObj = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      const clientId = "lead-" + email.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Garante registro do cliente/contato
      await AureumStore.saveUser({
        id: clientId,
        name,
        email,
        password: "123",
        role: "client",
        phone,
        verified: true
      });

      await AureumStore.sendChatMessage(
        {
          client_id: clientId,
          client_name: name,
          client_email: email,
          client_phone: phone,
          sender_role: "client",
          sender_name: name,
          text: `[Área: ${area}] ${message}`
        },
        fileObj
      );

      caseForm.reset();
      AureumStore.toast("✅ Mensagem e documento enviados diretamente ao painel do advogado!");
    });
  }

  // Agendamento público sincronizado com horários do advogado
  const bookForm = document.getElementById("public-booking-form");
  if (bookForm) {
    bookForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dateVal = document.getElementById("book-date").value;
      const timeVal = document.getElementById("book-time").value;
      if (!timeVal) {
        AureumStore.toast("⚠️ Selecione uma data com horário disponível.");
        return;
      }

      const name = document.getElementById("book-name").value.trim();
      const email = document.getElementById("book-email").value.trim();
      const phone = document.getElementById("book-phone").value.trim();
      const modality = document.getElementById("book-modality").value;
      const subject = document.getElementById("book-subject").value.trim();

      await AureumStore.saveAppointment({
        id: "apt-" + Date.now(),
        client_name: name,
        client_email: email,
        client_phone: phone,
        type: "Consulta Inicial",
        modality,
        date: dateVal,
        time: timeVal,
        subject,
        status: "Confirmado"
      });

      bookForm.reset();
      timeSelect.innerHTML = `<option value="">Selecione uma data primeiro</option>`;
      AureumStore.toast("📅 Consulta agendada com sucesso na agenda do advogado!");
    });
  }
});
