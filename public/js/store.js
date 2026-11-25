/**
 * ============================================================================
 * ENGINE DE DADOS UNIFICADO (SUPABASE REALTIME + STORAGE + PERSISTÊNCIA LOCAL)
 * ============================================================================
 */
window.AureumStore = (function () {
  const STORAGE_KEYS = {
    USERS: "aureum_v2_users",
    SESSION: "aureum_v2_session",
    CASES: "aureum_v2_cases",
    MESSAGES: "aureum_v2_messages",
    DOCUMENTS: "aureum_v2_documents",
    APPOINTMENTS: "aureum_v2_appointments",
    HOURS: "aureum_v2_hours",
    THEME: "aureum_v2_theme"
  };

  let supabaseClient = null;

  function isSupabaseReady() {
    const cfg = window.AUREUM_CONFIG || {};
    return Boolean(
      window.supabase &&
      cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      cfg.supabaseUrl.startsWith("https://") &&
      !cfg.supabaseUrl.includes("seu-projeto")
    );
  }

  function initSupabase() {
    if (isSupabaseReady() && !supabaseClient) {
      supabaseClient = window.supabase.createClient(
        window.AUREUM_CONFIG.supabaseUrl,
        window.AUREUM_CONFIG.supabaseAnonKey
      );
    }
    return supabaseClient;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Dados iniciais realistas para o escritório já abrir pronto para demonstração e venda
  function seedInitialData() {
    const defaultHours = {
      openTime: "08:00",
      closeTime: "18:00",
      lunchStart: "12:00",
      lunchEnd: "13:30",
      slotMinutes: 60,
      workingDays: [1, 2, 3, 4, 5],
      blockedDates: []
    };
    if (!localStorage.getItem(STORAGE_KEYS.HOURS)) {
      writeJSON(STORAGE_KEYS.HOURS, defaultHours);
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      writeJSON(STORAGE_KEYS.USERS, [
        {
          id: "admin-1",
          name: window.AUREUM_CONFIG.lawyerName || "Dr. Henrique Valença",
          email: "advogado@aureum.com.br",
          password: "123",
          role: "admin",
          oab: window.AUREUM_CONFIG.lawyerOab || "OAB/SP 348.920",
          phone: "(11) 99842-7100",
          verified: true
        },
        {
          id: "client-1",
          name: "Mariana Costa Almeida",
          email: "mariana.costa@email.com",
          password: "123",
          role: "client",
          cpf_cnpj: "384.910.228-40",
          phone: "(11) 98711-3340",
          verified: true
        },
        {
          id: "client-2",
          name: "Grupo Construtora Horizonte Ltda",
          email: "juridico@horizonteconstrutora.com.br",
          password: "123",
          role: "client",
          cpf_cnpj: "24.819.302/0001-19",
          phone: "(11) 97420-8812",
          verified: true
        }
      ]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
      writeJSON(STORAGE_KEYS.CASES, [
        {
          id: "case-101",
          cnj: "1048291-44.2026.8.26.0100",
          title: "Ação Indenizatória por Descumprimento Contratual",
          area: "Direito Civil & Contratos",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          court: "14ª Vara Cível do Foro Central - TJSP",
          phase: "Instrução Probatória",
          status: "Em Andamento",
          archived: false,
          value: "R$ 185.000,00",
          opened_at: "2026-08-14",
          updates: [
            {
              id: "upd-1",
              date: "2026-11-18",
              title: "Juntada de Parecer Técnico e Provas Documentais",
              description: "Protocolada petição intermediária com anexos comprovando a mora contratual da parte ré.",
              author: "Dr. Henrique Valença"
            },
            {
              id: "upd-2",
              date: "2026-10-02",
              title: "Decisão Saneadora Publicada",
              description: "Juízo deferiu a produção de prova documental suplementar.",
              author: "Dr. Henrique Valença"
            }
          ]
        },
        {
          id: "case-102",
          cnj: "0011942-88.2026.5.02.0012",
          title: "Defesa Trabalhista Estratégica — Reclamação Coletiva",
          area: "Direito Trabalhista Empresarial",
          client_id: "client-2",
          client_name: "Grupo Construtora Horizonte Ltda",
          client_email: "juridico@horizonteconstrutora.com.br",
          court: "12ª Vara do Trabalho de São Paulo - TRT2",
          phase: "Aguardando Audiência UNA",
          status: "Aguardando Audiência",
          archived: false,
          value: "R$ 420.000,00",
          opened_at: "2026-09-05",
          updates: [
            {
              id: "upd-3",
              date: "2026-11-20",
              title: "Contestação e Cartões de Ponto Protocolados",
              description: "Defesa completa protocolada dentro do prazo legal.",
              author: "Dr. Henrique Valença"
            }
          ]
        }
      ]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      writeJSON(STORAGE_KEYS.MESSAGES, [
        {
          id: "msg-1",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          client_phone: "(11) 98711-3340",
          sender_role: "client",
          sender_name: "Mariana Costa Almeida",
          text: "Boa tarde, Doutor! Estou enviando em anexo o contrato social atualizado e o comprovante de transferência bancária para juntar no processo.",
          attachment_name: "Contrato_e_Comprovante_2026.pdf",
          attachment_size: "1.4 MB",
          attachment_type: "application/pdf",
          attachment_url: "#documento-demonstrativo",
          read_by_admin: false,
          read_by_client: true,
          created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
        },
        {
          id: "msg-2",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          client_phone: "(11) 98711-3340",
          sender_role: "admin",
          sender_name: window.AUREUM_CONFIG.lawyerName || "Dr. Henrique Valença",
          text: "Olá, Mariana! Recebi o PDF perfeitamente. Já validei a documentação e farei o protocolo ainda hoje nos autos.",
          read_by_admin: true,
          read_by_client: true,
          created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
        },
        {
          id: "msg-3",
          client_id: "client-2",
          client_name: "Grupo Construtora Horizonte Ltda",
          client_email: "juridico@horizonteconstrutora.com.br",
          client_phone: "(11) 97420-8812",
          sender_role: "client",
          sender_name: "Grupo Construtora Horizonte Ltda",
          text: "Prezado Dr. Henrique, segue o dossiê completo de folhas de pagamento em PDF referente à audiência da próxima semana.",
          attachment_name: "Dossie_Folhas_Pagamento.pdf",
          attachment_size: "3.2 MB",
          attachment_type: "application/pdf",
          attachment_url: "#documento-demonstrativo",
          read_by_admin: false,
          read_by_client: true,
          created_at: new Date(Date.now() - 1800 * 1000).toISOString()
        }
      ]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
      writeJSON(STORAGE_KEYS.DOCUMENTS, [
        {
          id: "doc-1",
          title: "Contrato e Comprovante Bancário 2026",
          category: "Prova Documental",
          file_name: "Contrato_e_Comprovante_2026.pdf",
          file_size: "1.4 MB",
          file_url: "#documento-demonstrativo",
          direction: "client_to_admin",
          process_id: "case-101",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          status: "Aprovado",
          note: "Documento validado pelo advogado.",
          uploaded_at: "2026-11-24"
        },
        {
          id: "doc-2",
          title: "Dossiê Folhas de Pagamento",
          category: "Defesa Trabalhista",
          file_name: "Dossie_Folhas_Pagamento.pdf",
          file_size: "3.2 MB",
          file_url: "#documento-demonstrativo",
          direction: "client_to_admin",
          process_id: "case-102",
          client_id: "client-2",
          client_name: "Grupo Construtora Horizonte Ltda",
          client_email: "juridico@horizonteconstrutora.com.br",
          status: "Em Análise",
          note: "Enviado via chat para conferência.",
          uploaded_at: "2026-11-25"
        }
      ]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      const today = new Date();
      const fmt = (d) => d.toISOString().split("T")[0];
      const d1 = new Date(today); d1.setDate(today.getDate() + 1);
      const d2 = new Date(today); d2.setDate(today.getDate() + 3);
      writeJSON(STORAGE_KEYS.APPOINTMENTS, [
        {
          id: "apt-1",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          client_phone: "(11) 98711-3340",
          process_cnj: "1048291-44.2026.8.26.0100",
          type: "Reunião Cliente",
          modality: "Videoconferência",
          date: fmt(d1),
          time: "10:00",
          subject: "Alinhamento pré-audiência e revisão de testemunhas",
          status: "Confirmado",
          location_or_link: "https://meet.google.com/aureum-sala-01"
        },
        {
          id: "apt-2",
          client_id: "client-2",
          client_name: "Grupo Construtora Horizonte Ltda",
          client_email: "juridico@horizonteconstrutora.com.br",
          client_phone: "(11) 97420-8812",
          process_cnj: "0011942-88.2026.5.02.0012",
          type: "Audiência",
          modality: "Fórum / Tribunal",
          date: fmt(d2),
          time: "14:00",
          subject: "Audiência UNA - 12ª Vara do Trabalho",
          status: "Confirmado",
          location_or_link: "Fórum Ruy Barbosa - Sala 402"
        }
      ]);
    }
  }

  // Tema Claro / Escuro
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeButtons(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    updateThemeButtons(next);
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      btn.title = theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro";
    });
  }

  // Toast Notification
  function toast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  // Sessão de Usuário
  function getSession() {
    return readJSON(STORAGE_KEYS.SESSION, null);
  }

  function setSession(user) {
    writeJSON(STORAGE_KEYS.SESSION, user);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.location.href = "/login.html";
  }

  // Métodos de Dados (com sincronização automática com Supabase quando configurado)
  async function getUsers() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
      if (data && data.length) {
        writeJSON(STORAGE_KEYS.USERS, data);
        return data;
      }
    }
    return readJSON(STORAGE_KEYS.USERS, []);
  }

  async function saveUser(user) {
    const users = readJSON(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.unshift(user);
    writeJSON(STORAGE_KEYS.USERS, users);

    const sb = initSupabase();
    if (sb) {
      await sb.from("profiles").upsert({
        name: user.name,
        email: user.email,
        role: user.role,
        cpf_cnpj: user.cpf_cnpj || null,
        phone: user.phone || null,
        oab: user.oab || null,
        verified: true
      }, { onConflict: "email" });
    }
    return user;
  }

  async function getCases() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("processes").select("*").order("created_at", { ascending: false });
      if (data) {
        const local = readJSON(STORAGE_KEYS.CASES, []);
        if (data.length > 0) {
          // Mescla andamentos locais caso existam
          const merged = data.map((row) => {
            const match = local.find((l) => l.cnj === row.cnj);
            return { ...row, updates: match?.updates || [] };
          });
          writeJSON(STORAGE_KEYS.CASES, merged);
          return merged;
        }
      }
    }
    return readJSON(STORAGE_KEYS.CASES, []);
  }

  async function saveCase(caseObj) {
    const list = readJSON(STORAGE_KEYS.CASES, []);
    const idx = list.findIndex((c) => c.id === caseObj.id);
    if (idx >= 0) list[idx] = caseObj;
    else list.unshift(caseObj);
    writeJSON(STORAGE_KEYS.CASES, list);

    const sb = initSupabase();
    if (sb) {
      await sb.from("processes").upsert({
        cnj: caseObj.cnj,
        title: caseObj.title,
        area: caseObj.area,
        client_name: caseObj.client_name,
        client_email: caseObj.client_email,
        court: caseObj.court,
        phase: caseObj.phase,
        status: caseObj.status,
        archived: Boolean(caseObj.archived),
        value: caseObj.value || null
      });
    }
    return caseObj;
  }

  async function getMessages() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("chat_messages").select("*").order("created_at", { ascending: true });
      if (data && data.length > 0) {
        writeJSON(STORAGE_KEYS.MESSAGES, data);
        return data;
      }
    }
    return readJSON(STORAGE_KEYS.MESSAGES, []);
  }

  async function uploadFileToStorage(file) {
    if (!file) return null;
    const sb = initSupabase();
    if (sb) {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await sb.storage.from("documentos").upload(safeName, file);
      if (!error) {
        const { data } = sb.storage.from("documentos").getPublicUrl(safeName);
        return data.publicUrl;
      }
    }
    // Fallback em DataURL para visualização/download imediato no navegador
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("#arquivo-local");
      reader.readAsDataURL(file);
    });
  }

  async function sendChatMessage(msgPayload, fileObj = null) {
    let attachmentUrl = msgPayload.attachment_url || null;
    if (fileObj) {
      attachmentUrl = await uploadFileToStorage(fileObj);
    }

    const newMsg = {
      id: "msg-" + Date.now(),
      client_id: msgPayload.client_id,
      client_name: msgPayload.client_name,
      client_email: msgPayload.client_email,
      client_phone: msgPayload.client_phone || "",
      sender_role: msgPayload.sender_role,
      sender_name: msgPayload.sender_name,
      text: msgPayload.text,
      attachment_name: fileObj ? fileObj.name : msgPayload.attachment_name || null,
      attachment_size: fileObj ? (fileObj.size / (1024 * 1024)).toFixed(2) + " MB" : msgPayload.attachment_size || null,
      attachment_type: fileObj ? fileObj.type : msgPayload.attachment_type || null,
      attachment_url: attachmentUrl,
      read_by_admin: msgPayload.sender_role === "admin",
      read_by_client: msgPayload.sender_role === "client",
      created_at: new Date().toISOString()
    };

    const msgs = readJSON(STORAGE_KEYS.MESSAGES, []);
    msgs.push(newMsg);
    writeJSON(STORAGE_KEYS.MESSAGES, msgs);

    // Se houver arquivo PDF/documento anexado, registra também no Cofre de Documentos
    if (newMsg.attachment_name) {
      await saveDocument({
        id: "doc-" + Date.now(),
        title: newMsg.attachment_name.replace(/\.[^/.]+$/, ""),
        category: msgPayload.sender_role === "client" ? "Enviado via Chat" : "Documento do Escritório",
        file_name: newMsg.attachment_name,
        file_size: newMsg.attachment_size || "PDF",
        file_url: newMsg.attachment_url,
        direction: msgPayload.sender_role === "client" ? "client_to_admin" : "admin_to_client",
        client_id: newMsg.client_id,
        client_name: newMsg.client_name,
        client_email: newMsg.client_email,
        status: msgPayload.sender_role === "client" ? "Em Análise" : "Aprovado",
        note: newMsg.text,
        uploaded_at: new Date().toISOString().split("T")[0]
      });
    }

    const sb = initSupabase();
    if (sb) {
      await sb.from("chat_messages").insert({
        client_id: newMsg.client_id,
        client_name: newMsg.client_name,
        client_email: newMsg.client_email,
        client_phone: newMsg.client_phone,
        sender_role: newMsg.sender_role,
        sender_name: newMsg.sender_name,
        text: newMsg.text,
        attachment_name: newMsg.attachment_name,
        attachment_size: newMsg.attachment_size,
        attachment_type: newMsg.attachment_type,
        attachment_url: newMsg.attachment_url,
        read_by_admin: newMsg.read_by_admin,
        read_by_client: newMsg.read_by_client
      });
    }

    return newMsg;
  }

  async function markThreadRead(clientId, readerRole) {
    const msgs = readJSON(STORAGE_KEYS.MESSAGES, []);
    let changed = false;
    msgs.forEach((m) => {
      if (m.client_id === clientId) {
        if (readerRole === "admin" && !m.read_by_admin) {
          m.read_by_admin = true;
          changed = true;
        }
        if (readerRole === "client" && !m.read_by_client) {
          m.read_by_client = true;
          changed = true;
        }
      }
    });
    if (changed) {
      writeJSON(STORAGE_KEYS.MESSAGES, msgs);
    }
  }

  async function getDocuments() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("documents").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        writeJSON(STORAGE_KEYS.DOCUMENTS, data);
        return data;
      }
    }
    return readJSON(STORAGE_KEYS.DOCUMENTS, []);
  }

  async function saveDocument(docObj) {
    const docs = readJSON(STORAGE_KEYS.DOCUMENTS, []);
    const idx = docs.findIndex((d) => d.id === docObj.id);
    if (idx >= 0) docs[idx] = docObj;
    else docs.unshift(docObj);
    writeJSON(STORAGE_KEYS.DOCUMENTS, docs);

    const sb = initSupabase();
    if (sb) {
      await sb.from("documents").insert({
        title: docObj.title,
        category: docObj.category,
        file_name: docObj.file_name,
        file_size: docObj.file_size,
        file_url: docObj.file_url,
        direction: docObj.direction,
        client_id: docObj.client_id,
        client_name: docObj.client_name,
        client_email: docObj.client_email,
        status: docObj.status,
        note: docObj.note
      });
    }
    return docObj;
  }

  async function getAppointments() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("appointments").select("*").order("date", { ascending: true });
      if (data && data.length > 0) {
        writeJSON(STORAGE_KEYS.APPOINTMENTS, data);
        return data;
      }
    }
    return readJSON(STORAGE_KEYS.APPOINTMENTS, []);
  }

  async function saveAppointment(aptObj) {
    const list = readJSON(STORAGE_KEYS.APPOINTMENTS, []);
    const idx = list.findIndex((a) => a.id === aptObj.id);
    if (idx >= 0) list[idx] = aptObj;
    else list.unshift(aptObj);
    writeJSON(STORAGE_KEYS.APPOINTMENTS, list);

    const sb = initSupabase();
    if (sb) {
      await sb.from("appointments").insert({
        client_id: aptObj.client_id || null,
        client_name: aptObj.client_name,
        client_email: aptObj.client_email,
        client_phone: aptObj.client_phone || null,
        process_cnj: aptObj.process_cnj || null,
        type: aptObj.type,
        modality: aptObj.modality,
        date: aptObj.date,
        time: aptObj.time,
        subject: aptObj.subject,
        status: aptObj.status,
        location_or_link: aptObj.location_or_link || null
      });
    }
    return aptObj;
  }

  function getBusinessHours() {
    return readJSON(STORAGE_KEYS.HOURS, {
      openTime: "08:00",
      closeTime: "18:00",
      lunchStart: "12:00",
      lunchEnd: "13:30",
      slotMinutes: 60,
      workingDays: [1, 2, 3, 4, 5],
      blockedDates: []
    });
  }

  async function saveBusinessHours(hoursObj) {
    writeJSON(STORAGE_KEYS.HOURS, hoursObj);
    const sb = initSupabase();
    if (sb) {
      await sb.from("office_settings").upsert({
        id: "default",
        business_hours: hoursObj,
        updated_at: new Date().toISOString()
      });
    }
    return hoursObj;
  }

  // Gera horários disponíveis para uma data específica respeitando expediente, almoço, bloqueios e reuniões já marcadas
  async function getAvailableSlotsForDate(dateStr) {
    const hours = getBusinessHours();
    if (!dateStr) return [];
    if ((hours.blockedDates || []).includes(dateStr)) return [];

    const [y, m, d] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (!(hours.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek)) {
      return [];
    }

    const toMin = (hhmm) => {
      const [h, min] = hhmm.split(":").map(Number);
      return h * 60 + min;
    };
    const fromMin = (total) => {
      const h = String(Math.floor(total / 60)).padStart(2, "0");
      const min = String(total % 60).padStart(2, "0");
      return `${h}:${min}`;
    };

    const start = toMin(hours.openTime || "08:00");
    const end = toMin(hours.closeTime || "18:00");
    const lStart = hours.lunchStart ? toMin(hours.lunchStart) : -1;
    const lEnd = hours.lunchEnd ? toMin(hours.lunchEnd) : -1;
    const step = Number(hours.slotMinutes || 60);

    const appointments = await getAppointments();
    const bookedTimes = appointments
      .filter((a) => a.date === dateStr && a.status !== "Cancelado")
      .map((a) => a.time);

    const slots = [];
    for (let cur = start; cur + step <= end; cur += step) {
      const inLunch = lStart >= 0 && lEnd > lStart && cur >= lStart && cur < lEnd;
      const label = fromMin(cur);
      if (!inLunch && !bookedTimes.includes(label)) {
        slots.push(label);
      }
    }
    return slots;
  }

  function hideLoader() {
    const loader = document.getElementById("app-loader");
    if (loader) {
      setTimeout(() => loader.classList.add("hidden"), 350);
    }
  }

  return {
    init: async function () {
      initTheme();
      await window.loadRuntimeConfig();
      seedInitialData();
      initSupabase();
      hideLoader();
    },
    isSupabaseReady,
    initSupabase,
    toggleTheme,
    toast,
    getSession,
    setSession,
    logout,
    getUsers,
    saveUser,
    getCases,
    saveCase,
    getMessages,
    sendChatMessage,
    markThreadRead,
    getDocuments,
    saveDocument,
    getAppointments,
    saveAppointment,
    getBusinessHours,
    saveBusinessHours,
    getAvailableSlotsForDate
  };
})();
