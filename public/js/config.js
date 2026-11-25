/**
 * ============================================================================
 * ████████████████████████████████████████████████████████████████████████████
 * ██   CONFIGURAÇÃO PADRÃO DO ESCRITÓRIO & INTEGRAÇÃO SUPABASE             ██
 * ██   (Também editável diretamente pelo Painel Administrativo do Site)    ██
 * ████████████████████████████████████████████████████████████████████████████
 * ============================================================================
 */
window.AUREUM_CONFIG = {
  firmName: "AUREUM | Advocacia & Consultoria Jurídica",
  firmShortName: "AUREUM",
  lawyerName: "Dr. Henrique Valença",
  lawyerOab: "OAB/SP 348.920",
  lawyerEmail: "contato@aureumadvocacia.com.br",
  lawyerPhone: "(11) 99842-7100",
  firmAddress: "Av. Brigadeiro Faria Lima, 3477 - Conj. 1402, Itaim Bibi, São Paulo - SP",
  firmHeroHeadline: "Defesa Estratégica com Excelência e Rigor Jurídico.",
  firmHeroSubtitle:
    "Escolha seu advogado especialista, envie documentos em PDF, acompanhe processos em tempo real e agende sua consulta online ou presencial.",

  // Chave secreta inicial para cadastro de Advogados (alterável no Painel Admin)
  adminInviteCode: "AUREUM-ADMIN-2026",

  // Credenciais do Supabase (ou configure via variáveis de ambiente na Vercel/Render)
  supabaseUrl: "",
  supabaseAnonKey: ""
};

window.loadRuntimeConfig = async function () {
  try {
    const savedBrand = localStorage.getItem("aureum_brand_overrides");
    if (savedBrand) {
      Object.assign(window.AUREUM_CONFIG, JSON.parse(savedBrand));
    }
  } catch (e) {
    console.warn("Aviso ao ler overrides locais:", e);
  }

  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (res.ok) {
      const envCfg = await res.json();
      if (envCfg.supabaseUrl) window.AUREUM_CONFIG.supabaseUrl = envCfg.supabaseUrl;
      if (envCfg.supabaseAnonKey) window.AUREUM_CONFIG.supabaseAnonKey = envCfg.supabaseAnonKey;
      // Só usa a chave do env se o advogado ainda não tiver alterado pelo painel
      const localBrand = JSON.parse(localStorage.getItem("aureum_brand_overrides") || "{}");
      if (envCfg.adminInviteCode && !localBrand.adminInviteCode) {
        window.AUREUM_CONFIG.adminInviteCode = envCfg.adminInviteCode;
      }
      if (envCfg.firmName && !localBrand.firmName) window.AUREUM_CONFIG.firmName = envCfg.firmName;
      if (envCfg.lawyerName && !localBrand.lawyerName) window.AUREUM_CONFIG.lawyerName = envCfg.lawyerName;
      if (envCfg.lawyerOab && !localBrand.lawyerOab) window.AUREUM_CONFIG.lawyerOab = envCfg.lawyerOab;
      if (envCfg.lawyerEmail && !localBrand.lawyerEmail) window.AUREUM_CONFIG.lawyerEmail = envCfg.lawyerEmail;
      if (envCfg.lawyerPhone && !localBrand.lawyerPhone) window.AUREUM_CONFIG.lawyerPhone = envCfg.lawyerPhone;
      if (envCfg.firmAddress && !localBrand.firmAddress) window.AUREUM_CONFIG.firmAddress = envCfg.firmAddress;
    }
  } catch (_) {}

  document.querySelectorAll("[data-brand]").forEach((el) => {
    const key = el.getAttribute("data-brand");
    if (window.AUREUM_CONFIG[key]) {
      el.textContent = window.AUREUM_CONFIG[key];
    }
  });
};
