/**
 * ============================================================================
 * ████████████████████████████████████████████████████████████████████████████
 * ██                                                                        ██
 * ██   ÁREA DE CONFIGURAÇÃO DO ESCRITÓRIO & INTEGRAÇÃO SUPABASE             ██
 * ██   EDITE AS INFORMAÇÕES ABAIXO ANTES DE VENDER OU PUBLICAR O SITE!      ██
 * ██                                                                        ██
 * ████████████████████████████████████████████████████████████████████████████
 * ============================================================================
 */

window.AUREUM_CONFIG = {
  // 1. DADOS DO ESCRITÓRIO E DO ADVOGADO TITULAR (APARECEM EM TODO O SITE)
  firmName: "AUREUM | Advocacia & Consultoria Jurídica",
  firmShortName: "AUREUM",
  lawyerName: "Dr. Henrique Valença",
  lawyerOab: "OAB/SP 348.920",
  lawyerEmail: "contato@aureumadvocacia.com.br",
  lawyerPhone: "(11) 99842-7100",
  firmAddress: "Av. Brigadeiro Faria Lima, 3477 - Conj. 1402, Itaim Bibi, São Paulo - SP",
  firmHeroHeadline: "Defesa Estratégica com Excelência e Rigor Jurídico.",
  firmHeroSubtitle:
    "Atuação personalizada em Direito Empresarial, Civil, Trabalhista Estratégico e Planejamento Patrimonial. Acompanhe seu processo, envie documentos e converse diretamente com o advogado.",

  // 2. CÓDIGO SECRETO PARA CRIAR CONTA DE ADVOGADO ADMINISTRADOR
  // (Somente quem tiver este código pode se cadastrar como Admin na tela de Login)
  adminInviteCode: "AUREUM-ADMIN-2026",

  // 3. CREDENCIAIS DO SUPABASE (OBTENHA EM: SUPABASE > PROJECT SETTINGS > API)
  // Se você configurar as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no Render
  // ou na Vercel, o sistema carrega automaticamente sem precisar editar aqui!
  supabaseUrl: "",
  supabaseAnonKey: ""
};

/**
 * Sincroniza configurações vindas do servidor (Render / Vercel) e do painel Admin
 */
window.loadRuntimeConfig = async function () {
  // Carrega customizações salvas pelo advogado no Painel Administrativo
  try {
    const savedBrand = localStorage.getItem("aureum_brand_overrides");
    if (savedBrand) {
      Object.assign(window.AUREUM_CONFIG, JSON.parse(savedBrand));
    }
  } catch (e) {
    console.warn("Aviso ao ler customizações locais:", e);
  }

  // Busca variáveis de ambiente do Render/Vercel (/api/config)
  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (res.ok) {
      const envCfg = await res.json();
      if (envCfg.supabaseUrl) window.AUREUM_CONFIG.supabaseUrl = envCfg.supabaseUrl;
      if (envCfg.supabaseAnonKey) window.AUREUM_CONFIG.supabaseAnonKey = envCfg.supabaseAnonKey;
      if (envCfg.adminInviteCode) window.AUREUM_CONFIG.adminInviteCode = envCfg.adminInviteCode;
      if (envCfg.firmName) window.AUREUM_CONFIG.firmName = envCfg.firmName;
      if (envCfg.lawyerName) window.AUREUM_CONFIG.lawyerName = envCfg.lawyerName;
      if (envCfg.lawyerOab) window.AUREUM_CONFIG.lawyerOab = envCfg.lawyerOab;
      if (envCfg.lawyerEmail) window.AUREUM_CONFIG.lawyerEmail = envCfg.lawyerEmail;
      if (envCfg.lawyerPhone) window.AUREUM_CONFIG.lawyerPhone = envCfg.lawyerPhone;
      if (envCfg.firmAddress) window.AUREUM_CONFIG.firmAddress = envCfg.firmAddress;
    }
  } catch (_) {
    // Em modo estático puro sem backend, segue com window.AUREUM_CONFIG
  }

  // Aplica textos dinâmicos em todos os elementos marcados com data-brand
  document.querySelectorAll("[data-brand]").forEach((el) => {
    const key = el.getAttribute("data-brand");
    if (window.AUREUM_CONFIG[key]) {
      el.textContent = window.AUREUM_CONFIG[key];
    }
  });
};
