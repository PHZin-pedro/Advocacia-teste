window.AureumStore = (function () {
  const KEYS = {
    USERS: "aureum_v3_users",
    SESSION: "aureum_v3_session",
    CASES: "aureum_v3_cases",
    MESSAGES: "aureum_v3_messages",
    DOCUMENTS: "aureum_v3_documents",
    APPOINTMENTS: "aureum_v3_appointments",
    REVIEWS: "aureum_v3_reviews",
    HOURS: "aureum_v3_hours",
    THEME: "aureum_v3_theme"
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

  function seedInitialData() {
    if (!localStorage.getItem(KEYS.HOURS)) {
      writeJSON(KEYS.HOURS, {
        openTime: "08:00",
        closeTime: "18:00",
        lunchStart: "12:00",
        lunchEnd: "13:30",
        slotMinutes: 60,
        workingDays: [1, 2, 3, 4, 5],
        blockedDates: []
      });
    }

    if (!localStorage.getItem(KEYS.USERS)) {
      writeJSON(KEYS.USERS, [
        {
          id: "admin-1",
          name: window.AUREUM_CONFIG.lawyerName || "Dr. Henrique Valença",
          email: "advogado@aureum.com.br",
          password: "123",
          password_hash: "123",
          role: "admin",
          oab: window.AUREUM_CONFIG.lawyerOab || "OAB/SP 348.920",
          specialty: "Direito Empresarial & Contratos",
          bio: "Sócio fundador e Administrador Master com mais de 15 anos de atuação em contencioso estratégico, defesa corporativa e contratos de alta complexidade.",
          avatar_url: "",
          phone: "(11) 99842-7100",
          verified: true
        },
        {
          id: "lawyer-1",
          name: "Dra. Camila Monteiro",
          email: "camila@aureum.com.br",
          password: "123",
          password_hash: "123",
          role: "lawyer",
          oab: "OAB/SP 412.780",
          specialty: "Direito Trabalhista & Família",
          bio: "Especialista em resolução de conflitos trabalhistas estratégicos, inventários extrajudiciais e planejamento sucessório familiar.",
          avatar_url: "",
          phone: "(11) 99715-4420",
          verified: true
        },
        {
          id: "client-1",
          name: "Mariana Costa Almeida",
          email: "mariana.costa@email.com",
          password: "123",
          password_hash: "123",
          role: "client",
          cpf_cnpj: "384.910.228-40",
          phone: "(11) 98711-3340",
          verified: true
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.CASES)) {
      writeJSON(KEYS.CASES, [
        {
          id: "case-101",
          cnj: "1048291-44.2026.8.26.0100",
          title: "Ação Indenizatória por Descumprimento Contratual",
          area: "Direito Civil & Contratos",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          lawyer_id: "admin-1",
          lawyer_name: "Dr. Henrique Valença",
          court: "14ª Vara Cível do Foro Central - TJSP",
          phase: "Instrução Probatória",
          status: "Em Andamento",
          archived: false,
          opened_at: "2026-08-14",
          updates: [
            {
              id: "upd-1",
              date: "2026-11-18",
              title: "Juntada de Parecer Técnico e Provas Documentais",
              description: "Protocolada petição intermediária com anexos comprovando a mora contratual.",
              author: "Dr. Henrique Valença"
            }
          ]
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.MESSAGES)) {
      writeJSON(KEYS.MESSAGES, [
        {
          id: "msg-1",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          client_phone: "(11) 98711-3340",
          lawyer_id: "admin-1",
          lawyer_name: "Dr. Henrique Valença",
          sender_role: "client",
          sender_name: "Mariana Costa Almeida",
          text: "Boa tarde, Doutor! Estou enviando o contrato assinado em PDF para análise.",
          attachment_name: "Contrato_Assinado_2026.pdf",
          attachment_size: "1.4 MB",
          attachment_type: "application/pdf",
          attachment_url: "#documento-demonstrativo",
          read_by_admin: false,
          read_by_client: true,
          created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.DOCUMENTS)) {
      writeJSON(KEYS.DOCUMENTS, [
        {
          id: "doc-1",
          title: "Contrato Assinado 2026",
          category: "Prova Documental",
          file_name: "Contrato_Assinado_2026.pdf",
          file_size: "1.4 MB",
          file_url: "#documento-demonstrativo",
          direction: "client_to_admin",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          lawyer_id: "admin-1",
          status: "Em Análise",
          uploaded_at: "2026-11-24"
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 1);
      writeJSON(KEYS.APPOINTMENTS, [
        {
          id: "apt-1",
          client_id: "client-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          client_phone: "(11) 98711-3340",
          lawyer_id: "admin-1",
          lawyer_name: "Dr. Henrique Valença",
          type: "Reunião Cliente",
          modality: "Videoconferência",
          date: d1.toISOString().split("T")[0],
          time: "10:00",
          subject: "Alinhamento estratégico pré-audiência",
          status: "Confirmado"
        }
      ]);
    }

    if (!localStorage.getItem(KEYS.REVIEWS)) {
      writeJSON(KEYS.REVIEWS, [
        {
          id: "rev-1",
          client_name: "Mariana Costa Almeida",
          client_email: "mariana.costa@email.com",
          lawyer_id: "admin-1",
          lawyer_name: "Dr. Henrique Valença",
          area: "Direito Civil & Contratos",
          rating: 5,
          comment: "Atendimento impecável! Consegui enviar todos os documentos em PDF pelo site e o Doutor respondeu rapidamente com total clareza.",
          reply: "Muito obrigado pela confiança, Mariana! Seguimos firmes na defesa dos seus direitos.",
          featured: true,
          created_at: "2026-11-15T14:20:00.000Z"
        },
        {
          id: "rev-2",
          client_name: "Roberto Mendes Ferreira",
          client_email: "roberto.mendes@empresa.com.br",
          lawyer_id: "lawyer-1",
          lawyer_name: "Dra. Camila Monteiro",
          area: "Direito Trabalhista",
          rating: 5,
          comment: "Profissionalismo fora de série. Acompanhei cada passo da minha ação sem precisar sair de casa.",
          reply: "",
          featured: true,
          created_at: "2026-11-20T10:05:00.000Z"
        }
      ]);
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(KEYS.THEME) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeButtons(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEYS.THEME, next);
    updateThemeButtons(next);
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const isDark = theme === "dark";
      if (btn.hasAttribute("data-theme-label")) {
        btn.innerHTML = isDark ? "☀️ Modo Claro" : "🌙 Modo Escuro";
      } else {
        btn.innerHTML = isDark ? "☀️" : "🌙";
      }
      btn.title = isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro";
    });
  }

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

  function getSession() { return readJSON(KEYS.SESSION, null); }
  function setSession(user) { writeJSON(KEYS.SESSION, user); }
  function logout() {
    localStorage.removeItem(KEYS.SESSION);
    window.location.href = "/login.html";
  }

  // ==========================================================================
  // USUÁRIOS, ADVOGADOS & CONTROLE ADMINISTRATIVO (SENHA / DEMISSÃO)
  // ==========================================================================
  async function getUsers() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: true });
      if (data && data.length > 0) {
        const localUsers = readJSON(KEYS.USERS, []);
        const normalized = data.map((u) => {
          const localMatch = localUsers.find((l) => l.id === u.id || l.email.toLowerCase() === u.email.toLowerCase());
          const effectivePass = u.password_hash || (localMatch ? (localMatch.password || localMatch.password_hash) : "");
          return {
            ...u,
            password: effectivePass,
            password_hash: effectivePass
          };
        });
        writeJSON(KEYS.USERS, normalized);
        return normalized;
      }
    }
    return readJSON(KEYS.USERS, []);
  }

  async function getLawyers() {
    const users = await getUsers();
    return users.filter((u) => u.role === "admin" || u.role === "lawyer");
  }

  async function saveUser(user) {
    const users = readJSON(KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    const effectivePass = user.password || user.password_hash || (idx >= 0 ? (users[idx].password || users[idx].password_hash) : "123");
    const enrichedUser = {
      ...user,
      password: effectivePass,
      password_hash: effectivePass
    };

    if (idx >= 0) users[idx] = { ...users[idx], ...enrichedUser };
    else users.push(enrichedUser);
    writeJSON(KEYS.USERS, users);

    const session = getSession();
    if (session && (session.id === enrichedUser.id || session.email === enrichedUser.email)) {
      setSession({ ...session, ...enrichedUser });
    }

    const sb = initSupabase();
    if (sb) {
      await sb.from("profiles").upsert({
        id: enrichedUser.id,
        name: enrichedUser.name,
        email: enrichedUser.email,
        password_hash: effectivePass,
        role: enrichedUser.role,
        cpf_cnpj: enrichedUser.cpf_cnpj || null,
        phone: enrichedUser.phone || null,
        oab: enrichedUser.oab || null,
        specialty: enrichedUser.specialty || null,
        bio: enrichedUser.bio || null,
        avatar_url: enrichedUser.avatar_url || null,
        verified: true
      }, { onConflict: "email" });
    }
    return enrichedUser;
  }

  async function adminUpdateLawyerPassword(adminId, lawyerId, newPassword) {
    const session = getSession();
    if (!session || session.role !== "admin" || session.id !== adminId) {
      throw new Error("Acesso negado: apenas a conta Admin pode editar senhas.");
    }

    const users = readJSON(KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === lawyerId);
    if (idx >= 0) {
      users[idx].password = newPassword;
      users[idx].password_hash = newPassword;
      writeJSON(KEYS.USERS, users);
    }

    const sb = initSupabase();
    if (sb) {
      const { error: rpcErr } = await sb.rpc("admin_update_lawyer_password", {
        p_admin_id: adminId,
        p_target_user_id: lawyerId,
        p_new_password: newPassword
      });
      if (rpcErr) {
        await sb.from("profiles").update({ password_hash: newPassword }).eq("id", lawyerId);
      }
    }
    return true;
  }

  async function adminDeleteLawyerAccount(adminId, lawyerId) {
    const session = getSession();
    if (!session || session.role !== "admin" || session.id !== adminId) {
      throw new Error("Acesso negado: apenas a conta Admin pode excluir contas de advogados.");
    }
    if (adminId === lawyerId) {
      throw new Error("A conta Admin principal não pode excluir a si mesma.");
    }

    const users = readJSON(KEYS.USERS, []).filter((u) => u.id !== lawyerId);
    writeJSON(KEYS.USERS, users);

    // Desvincula o advogado demitido sem apagar o histórico do cliente
    const cases = readJSON(KEYS.CASES, []).map((c) => c.lawyer_id === lawyerId ? { ...c, lawyer_id: null } : c);
    writeJSON(KEYS.CASES, cases);

    const msgs = readJSON(KEYS.MESSAGES, []).map((m) => m.lawyer_id === lawyerId ? { ...m, lawyer_id: null } : m);
    writeJSON(KEYS.MESSAGES, msgs);

    const apts = readJSON(KEYS.APPOINTMENTS, []).map((a) => a.lawyer_id === lawyerId ? { ...a, lawyer_id: null } : a);
    writeJSON(KEYS.APPOINTMENTS, apts);

    const sb = initSupabase();
    if (sb) {
      const { error: rpcErr } = await sb.rpc("admin_delete_lawyer_account", {
        p_admin_id: adminId,
        p_target_user_id: lawyerId
      });
      if (rpcErr) {
        await sb.from("profiles").delete().eq("id", lawyerId).eq("role", "lawyer");
      }
    }
    return true;
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
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("#arquivo-local");
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // PROCESSOS, MENSAGENS, DOCUMENTOS, AGENDA & AVALIAÇÕES
  // ==========================================================================
  async function getCases() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("processes").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const local = readJSON(KEYS.CASES, []);
        const merged = data.map((r) => {
          const match = local.find((l) => l.cnj === r.cnj);
          return { ...r, updates: match?.updates || [] };
        });
        writeJSON(KEYS.CASES, merged);
        return merged;
      }
    }
    return readJSON(KEYS.CASES, []);
  }

  async function saveCase(caseObj) {
    const list = readJSON(KEYS.CASES, []);
    const idx = list.findIndex((c) => c.id === caseObj.id);
    if (idx >= 0) list[idx] = caseObj;
    else list.unshift(caseObj);
    writeJSON(KEYS.CASES, list);

    const sb = initSupabase();
    if (sb) {
      await sb.from("processes").upsert({
        id: caseObj.id,
        cnj: caseObj.cnj,
        title: caseObj.title,
        area: caseObj.area,
        client_id: caseObj.client_id || null,
        client_name: caseObj.client_name,
        client_email: caseObj.client_email,
        lawyer_id: caseObj.lawyer_id || null,
        lawyer_name: caseObj.lawyer_name || null,
        court: caseObj.court,
        phase: caseObj.phase,
        status: caseObj.status,
        archived: Boolean(caseObj.archived)
      });
    }
    return caseObj;
  }

  async function getMessages() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("chat_messages").select("*").order("created_at", { ascending: true });
      if (data && data.length > 0) {
        writeJSON(KEYS.MESSAGES, data);
        return data;
      }
    }
    const local = readJSON(KEYS.MESSAGES, []);
    return local.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
      lawyer_id: msgPayload.lawyer_id || "admin-1",
      lawyer_name: msgPayload.lawyer_name || window.AUREUM_CONFIG.lawyerName,
      sender_role: msgPayload.sender_role,
      sender_name: msgPayload.sender_name,
      text: msgPayload.text,
      attachment_name: fileObj ? fileObj.name : msgPayload.attachment_name || null,
      attachment_size: fileObj ? (fileObj.size / (1024 * 1024)).toFixed(2) + " MB" : msgPayload.attachment_size || null,
      attachment_type: fileObj ? fileObj.type : msgPayload.attachment_type || null,
      attachment_url: attachmentUrl,
      read_by_admin: msgPayload.sender_role === "admin" || msgPayload.sender_role === "lawyer",
      read_by_client: msgPayload.sender_role === "client",
      created_at: new Date().toISOString()
    };

    const msgs = readJSON(KEYS.MESSAGES, []);
    msgs.push(newMsg);
    writeJSON(KEYS.MESSAGES, msgs);

    if (newMsg.attachment_name) {
      await saveDocument({
        id: "doc-" + Date.now(),
        title: newMsg.attachment_name.replace(/\.[^/.]+$/, ""),
        category: msgPayload.sender_role === "client" ? "Enviado via Chat" : "Documento do Advogado",
        file_name: newMsg.attachment_name,
        file_size: newMsg.attachment_size || "PDF",
        file_url: newMsg.attachment_url,
        direction: msgPayload.sender_role === "client" ? "client_to_admin" : "admin_to_client",
        client_id: newMsg.client_id,
        client_name: newMsg.client_name,
        client_email: newMsg.client_email,
        lawyer_id: newMsg.lawyer_id,
        status: msgPayload.sender_role === "client" ? "Em Análise" : "Aprovado",
        uploaded_at: new Date().toISOString().split("T")[0]
      });
    }

    const sb = initSupabase();
    if (sb) {
      await sb.from("chat_messages").insert(newMsg);
    }
    return newMsg;
  }

  async function markThreadRead(clientId, readerRole) {
    const msgs = readJSON(KEYS.MESSAGES, []);
    let changed = false;
    msgs.forEach((m) => {
      if (m.client_id === clientId) {
        if ((readerRole === "admin" || readerRole === "lawyer") && !m.read_by_admin) {
          m.read_by_admin = true;
          changed = true;
        }
        if (readerRole === "client" && !m.read_by_client) {
          m.read_by_client = true;
          changed = true;
        }
      }
    });
    if (changed) writeJSON(KEYS.MESSAGES, msgs);

    const sb = initSupabase();
    if (sb && (readerRole === "admin" || readerRole === "lawyer")) {
      await sb.from("chat_messages").update({ read_by_admin: true }).eq("client_id", clientId);
    }
  }

  async function getDocuments() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("documents").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        writeJSON(KEYS.DOCUMENTS, data);
        return data;
      }
    }
    return readJSON(KEYS.DOCUMENTS, []);
  }

  async function saveDocument(docObj) {
    const docs = readJSON(KEYS.DOCUMENTS, []);
    const idx = docs.findIndex((d) => d.id === docObj.id);
    if (idx >= 0) docs[idx] = docObj;
    else docs.unshift(docObj);
    writeJSON(KEYS.DOCUMENTS, docs);

    const sb = initSupabase();
    if (sb) {
      await sb.from("documents").upsert(docObj);
    }
    return docObj;
  }

  async function getAppointments() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("appointments").select("*").order("date", { ascending: true });
      if (data && data.length > 0) {
        writeJSON(KEYS.APPOINTMENTS, data);
        return data;
      }
    }
    return readJSON(KEYS.APPOINTMENTS, []);
  }

  async function saveAppointment(aptObj) {
    const list = readJSON(KEYS.APPOINTMENTS, []);
    const idx = list.findIndex((a) => a.id === aptObj.id);
    if (idx >= 0) list[idx] = aptObj;
    else list.unshift(aptObj);
    writeJSON(KEYS.APPOINTMENTS, list);

    const sb = initSupabase();
    if (sb) {
      await sb.from("appointments").upsert(aptObj);
    }
    return aptObj;
  }

  async function getReviews() {
    const sb = initSupabase();
    if (sb) {
      const { data } = await sb.from("reviews").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        writeJSON(KEYS.REVIEWS, data);
        return data;
      }
    }
    return readJSON(KEYS.REVIEWS, []);
  }

  async function saveReview(revObj) {
    const list = readJSON(KEYS.REVIEWS, []);
    const idx = list.findIndex((r) => r.id === revObj.id);
    if (idx >= 0) list[idx] = revObj;
    else list.unshift(revObj);
    writeJSON(KEYS.REVIEWS, list);

    const sb = initSupabase();
    if (sb) {
      await sb.from("reviews").upsert(revObj);
    }
    return revObj;
  }

  async function deleteReview(revId) {
    const list = readJSON(KEYS.REVIEWS, []).filter((r) => r.id !== revId);
    writeJSON(KEYS.REVIEWS, list);
    const sb = initSupabase();
    if (sb) {
      await sb.from("reviews").delete().eq("id", revId);
    }
  }

  function getBusinessHours() {
    return readJSON(KEYS.HOURS, {
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
    writeJSON(KEYS.HOURS, hoursObj);
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

  async function syncOfficeSettingsFromSupabase() {
    const sb = initSupabase();
    if (!sb) return;
    try {
      const { data } = await sb.from("office_settings").select("*").eq("id", "default").single();
      if (data) {
        if (data.admin_invite_code) window.AUREUM_CONFIG.adminInviteCode = data.admin_invite_code;
        if (data.firm_name) window.AUREUM_CONFIG.firmName = data.firm_name;
        if (data.firm_short_name) window.AUREUM_CONFIG.firmShortName = data.firm_short_name;
        if (data.lawyer_email) window.AUREUM_CONFIG.lawyerEmail = data.lawyer_email;
        if (data.lawyer_phone) window.AUREUM_CONFIG.lawyerPhone = data.lawyer_phone;
        if (data.firm_address) window.AUREUM_CONFIG.firmAddress = data.firm_address;
        if (data.business_hours) writeJSON(KEYS.HOURS, data.business_hours);
      }
    } catch (_) {}
  }

  async function saveOfficeSettings(overrides) {
    const session = getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Acesso negado: apenas a conta Admin pode alterar a chave secreta.");
    }

    const current = JSON.parse(localStorage.getItem("aureum_brand_overrides") || "{}");
    const merged = { ...current, ...overrides };
    localStorage.setItem("aureum_brand_overrides", JSON.stringify(merged));
    Object.assign(window.AUREUM_CONFIG, merged);

    const sb = initSupabase();
    if (sb) {
      await sb.from("office_settings").upsert({
        id: "default",
        firm_name: window.AUREUM_CONFIG.firmName,
        firm_short_name: window.AUREUM_CONFIG.firmShortName,
        lawyer_name: window.AUREUM_CONFIG.lawyerName,
        lawyer_oab: window.AUREUM_CONFIG.lawyerOab,
        lawyer_email: window.AUREUM_CONFIG.lawyerEmail,
        lawyer_phone: window.AUREUM_CONFIG.lawyerPhone,
        firm_address: window.AUREUM_CONFIG.firmAddress,
        admin_invite_code: window.AUREUM_CONFIG.adminInviteCode,
        updated_at: new Date().toISOString()
      });
    }
  }

  async function getAvailableSlotsForDate(dateStr, lawyerId = null) {
    const hours = getBusinessHours();
    if (!dateStr) return [];
    if ((hours.blockedDates || []).includes(dateStr)) return [];

    const [y, m, d] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (!(hours.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek)) return [];

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
      .filter((a) => a.date === dateStr && a.status !== "Cancelado" && (!lawyerId || a.lawyer_id === lawyerId))
      .map((a) => a.time);

    const slots = [];
    for (let cur = start; cur + step <= end; cur += step) {
      const inLunch = lStart >= 0 && lEnd > lStart && cur >= lStart && cur < lEnd;
      const label = fromMin(cur);
      if (!inLunch && !bookedTimes.includes(label)) slots.push(label);
    }
    return slots;
  }

  function hideLoader() {
    const loader = document.getElementById("app-loader");
    if (loader) setTimeout(() => loader.classList.add("hidden"), 250);
  }

  return {
    init: async function () {
      initTheme();
      await window.loadRuntimeConfig();
      seedInitialData();
      initSupabase();
      await syncOfficeSettingsFromSupabase();
      hideLoader();
    },
    isSupabaseReady,
    toggleTheme,
    toast,
    getSession,
    setSession,
    logout,
    getUsers,
    getLawyers,
    saveUser,
    adminUpdateLawyerPassword,
    adminDeleteLawyerAccount,
    uploadFileToStorage,
    getCases,
    saveCase,
    getMessages,
    sendChatMessage,
    markThreadRead,
    getDocuments,
    saveDocument,
    getAppointments,
    saveAppointment,
    getReviews,
    saveReview,
    deleteReview,
    getBusinessHours,
    saveBusinessHours,
    saveOfficeSettings,
    getAvailableSlotsForDate
  };
})();
