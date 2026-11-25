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

window.quickDemoLogin = async function (role) {
  const users = await AureumStore.getUsers();
  const user = users.find((u) => u.role === role);
  if (user) {
    AureumStore.setSession(user);
    window.location.href = role === "admin" ? "/admin.html" : "/cliente.html";
  }
};

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

  // Login
  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;

    const users = await AureumStore.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email && (!u.password || u.password === pass)
    );

    if (!found) {
      AureumStore.toast("❌ E-mail ou senha inválidos.");
      return;
    }

    AureumStore.setSession(found);
    window.location.href = found.role === "admin" ? "/admin.html" : "/cliente.html";
  });

  // Cadastro Cliente com Verificação OTP de 6 dígitos
  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const otpBox = document.getElementById("otp-box");
    const otpInput = document.getElementById("reg-otp-input");

    if (!generatedOtp) {
      generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      otpBox.style.display = "block";
      document.getElementById("otp-hint").textContent =
        `Código de verificação enviado! (Código de validação: ${generatedOtp})`;
      document.getElementById("reg-submit-btn").textContent = "Confirmar Código & Finalizar Cadastro";
      AureumStore.toast(`🔐 Código de verificação gerado: ${generatedOtp}`);
      return;
    }

    if (otpInput.value.trim() !== generatedOtp) {
      AureumStore.toast("⚠️ Código OTP incorreto. Verifique os 6 dígitos.");
      return;
    }

    const newUser = {
      id: "client-" + Date.now(),
      name: document.getElementById("reg-name").value.trim(),
      email: document.getElementById("reg-email").value.trim(),
      phone: document.getElementById("reg-phone").value.trim(),
      cpf_cnpj: document.getElementById("reg-cpf").value.trim(),
      password: document.getElementById("reg-pass").value,
      role: "client",
      verified: true
    };

    await AureumStore.saveUser(newUser);
    AureumStore.setSession(newUser);
    window.location.href = "/cliente.html";
  });

  // Cadastro Admin
  document.getElementById("form-admin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("adm-code").value.trim();
    if (code !== window.AUREUM_CONFIG.adminInviteCode) {
      AureumStore.toast("❌ Código Secreto Administrativo inválido.");
      return;
    }

    const adminUser = {
      id: "admin-" + Date.now(),
      name: document.getElementById("adm-name").value.trim(),
      oab: document.getElementById("adm-oab").value.trim(),
      email: document.getElementById("adm-email").value.trim(),
      password: document.getElementById("adm-pass").value,
      role: "admin",
      verified: true
    };

    await AureumStore.saveUser(adminUser);
    AureumStore.setSession(adminUser);
    window.location.href = "/admin.html";
  });
});
