let generatedOtp = null;

function switchAuthTab(tabName) {
  document.querySelectorAll(".auth-tab-btn").forEach((btn) => {
    const active = btn.getAttribute("data-auth-tab") === tabName;
    btn.className = active ? "btn btn-sm auth-tab-btn btn-gold" : "btn btn-sm auth-tab-btn btn-ghost";
  });
  document.getElementById("form-login").style.display = tabName === "login" ? "block" : "none";
  document.getElementById("form-register").style.display = tabName === "register" ? "block" : "none";
  document.getElementById("form-admin").style.display = tabName === "admin" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  await AureumStore.init();

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab");
  if (initialTab && ["login", "register", "admin"].includes(initialTab)) {
    switchAuthTab(initialTab);
  }

  document.querySelectorAll(".auth-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchAuthTab(btn.getAttribute("data-auth-tab")));
  });

  AureumValidators.bindCPFInput(
    document.getElementById("reg-cpf"),
    document.getElementById("reg-cpf-hint")
  );
  AureumValidators.bindOABInput(
    document.getElementById("adm-oab"),
    document.getElementById("adm-oab-hint")
  );

  const regPhone = document.getElementById("reg-phone");
  if (regPhone) regPhone.addEventListener("input", () => { regPhone.value = AureumValidators.maskPhone(regPhone.value); });

  // Login (Admin, Advogado ou Cliente)
  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;

    const users = await AureumStore.getUsers();
    const found = users.find((u) => {
      const storedPass = u.password || u.password_hash || "";
      return u.email.toLowerCase() === email && storedPass === pass;
    });

    if (!found) {
      AureumStore.toast("❌ E-mail ou senha inválidos.");
      return;
    }
    AureumStore.setSession(found);
    window.location.href = (found.role === "admin" || found.role === "lawyer") ? "/admin.html" : "/cliente.html";
  });

  // Cadastro Cliente com Verificação de CPF 11 dígitos + OTP
  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cpfRes = AureumValidators.validateCPF(document.getElementById("reg-cpf").value);
    if (!cpfRes.valid) {
      AureumStore.toast(`❌ ${cpfRes.message}`);
      document.getElementById("reg-cpf").focus();
      return;
    }

    const emailVal = document.getElementById("reg-email").value.trim().toLowerCase();
    const existingUsers = await AureumStore.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === emailVal)) {
      AureumStore.toast("⚠️ Este e-mail já está cadastrado. Faça login.");
      return;
    }

    const otpBox = document.getElementById("otp-box");
    const otpInput = document.getElementById("reg-otp-input");

    if (!generatedOtp) {
      generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      otpBox.style.display = "block";
      document.getElementById("otp-hint").textContent = `Código de validação: ${generatedOtp}`;
      document.getElementById("reg-submit-btn").textContent = "Confirmar Código & Finalizar";
      AureumStore.toast(`🔐 Código gerado: ${generatedOtp}`);
      return;
    }

    if (otpInput.value.trim() !== generatedOtp) {
      AureumStore.toast("⚠️ Código OTP incorreto.");
      return;
    }

    const newUser = {
      id: "client-" + Date.now(),
      name: document.getElementById("reg-name").value.trim(),
      email: emailVal,
      phone: document.getElementById("reg-phone").value.trim(),
      cpf_cnpj: cpfRes.formatted,
      password: document.getElementById("reg-pass").value,
      password_hash: document.getElementById("reg-pass").value,
      role: "client",
      verified: true
    };

    await AureumStore.saveUser(newUser);
    AureumStore.setSession(newUser);
    window.location.href = "/cliente.html";
  });

  // Cadastro Advogado (role: 'lawyer') com Validação OAB + Chave Secreta exclusiva do Admin
  document.getElementById("form-admin").addEventListener("submit", async (e) => {
    e.preventDefault();

    const oabRes = AureumValidators.validateOAB(document.getElementById("adm-oab").value);
    if (!oabRes.valid) {
      AureumStore.toast(`❌ ${oabRes.message}`);
      document.getElementById("adm-oab").focus();
      return;
    }

    const code = document.getElementById("adm-code").value.trim();
    if (code !== window.AUREUM_CONFIG.adminInviteCode) {
      AureumStore.toast("❌ Chave Secreta do Escritório incorreta.");
      return;
    }

    const emailVal = document.getElementById("adm-email").value.trim().toLowerCase();
    const existingUsers = await AureumStore.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === emailVal)) {
      AureumStore.toast("⚠️ Este e-mail já está cadastrado no sistema.");
      return;
    }
    if (existingUsers.some((u) => u.oab && u.oab.toUpperCase() === oabRes.normalized)) {
      AureumStore.toast("⚠️ Esta inscrição OAB já está cadastrada no sistema.");
      return;
    }

    const passVal = document.getElementById("adm-pass").value;
    const lawyerUser = {
      id: "lawyer-" + Date.now(),
      name: document.getElementById("adm-name").value.trim(),
      oab: oabRes.normalized,
      specialty: document.getElementById("adm-specialty").value.trim(),
      bio: "Advogado(a) associado(a) com atuação dedicada e atendimento digital personalizado.",
      avatar_url: "",
      email: emailVal,
      password: passVal,
      password_hash: passVal,
      role: "lawyer",
      verified: true
    };

    await AureumStore.saveUser(lawyerUser);
    AureumStore.setSession(lawyerUser);
    window.location.href = "/admin.html";
  });
});
