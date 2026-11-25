/**
 * ============================================================================
 * VALIDADORES BRASILEIROS RIGOROSOS: CPF (11 DÍGITOS + DÍGITO VERIFICADOR) & OAB
 * ============================================================================
 */
window.AureumValidators = (function () {
  const VALID_UFS = new Set([
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ]);

  // Máscara que NUNCA deixa passar de 11 dígitos numéricos
  function maskCPF(rawValue) {
    const digits = String(rawValue || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  // Validação matemática oficial dos 11 dígitos e dígitos verificadores do CPF
  function validateCPF(rawCpf) {
    const cpf = String(rawCpf || "").replace(/\D/g, "");
    if (cpf.length !== 11) {
      return {
        valid: false,
        digits: cpf,
        message: `CPF incompleto (${cpf.length}/11 dígitos). Digite todos os 11 números.`
      };
    }

    // Rejeita sequências repetidas (000.000.000-00, 111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(cpf)) {
      return {
        valid: false,
        digits: cpf,
        message: "CPF inválido (sequência repetida não permitida)."
      };
    }

    // 1º dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9), 10)) {
      return {
        valid: false,
        digits: cpf,
        message: "CPF inválido — dígito verificador não confere."
      };
    }

    // 2º dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10), 10)) {
      return {
        valid: false,
        digits: cpf,
        message: "CPF inválido — segundo dígito verificador incorreto."
      };
    }

    return {
      valid: true,
      digits: cpf,
      formatted: maskCPF(cpf),
      message: "✓ CPF válido e verificado (11 dígitos)."
    };
  }

  // Validação e formatação de inscrição OAB (ex: OAB/SP 348.920 ou GO 45123)
  function validateOAB(rawOab) {
    const cleaned = String(rawOab || "").toUpperCase().trim();
    // Aceita formatos: OAB/SP 348.920, OAB-SP 348920, SP 348920, OAB/GO 45.123-A
    const match = cleaned.match(/^(?:OAB[\s\/-]*)?([A-Z]{2})[\s\/-]*(\d{3,6}|\d{1,3}\.\d{3})(?:[\s-]*([ABENPS]))?$/);

    if (!match) {
      return {
        valid: false,
        message: "Formato OAB inválido. Use UF + número (ex: OAB/SP 348.920)."
      };
    }

    const uf = match[1];
    const numDigits = match[2].replace(/\D/g, "");
    const suffix = match[3] || "";

    if (!VALID_UFS.has(uf)) {
      return {
        valid: false,
        message: `Seccional "${uf}" inválida. Informe uma UF brasileira válida (ex: SP, RJ, GO, MG).`
      };
    }

    if (numDigits.length < 4 || numDigits.length > 6 || /^0+$/.test(numDigits)) {
      return {
        valid: false,
        message: "Número da OAB deve conter entre 4 e 6 dígitos válidos."
      };
    }

    const formattedNum = numDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const normalized = `OAB/${uf} ${formattedNum}${suffix ? "-" + suffix : ""}`;

    return {
      valid: true,
      normalized,
      uf,
      number: numDigits,
      message: `✓ Inscrição ${normalized} validada.`
    };
  }

  function maskPhone(raw) {
    const d = String(raw || "").replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  // Conecta máscara automática e feedback visual em qualquer input de CPF
  function bindCPFInput(inputEl, hintEl) {
    if (!inputEl) return;
    inputEl.setAttribute("maxlength", "14");
    inputEl.setAttribute("inputmode", "numeric");

    const update = () => {
      inputEl.value = maskCPF(inputEl.value);
      if (!hintEl) return;
      if (!inputEl.value) {
        hintEl.textContent = "";
        hintEl.className = "validation-hint";
        return;
      }
      const res = validateCPF(inputEl.value);
      hintEl.textContent = res.message;
      hintEl.className = `validation-hint ${res.valid ? "valid" : "invalid"}`;
    };

    inputEl.addEventListener("input", update);
    inputEl.addEventListener("blur", update);
  }

  // Conecta validação visual em qualquer input de OAB
  function bindOABInput(inputEl, hintEl) {
    if (!inputEl) return;
    const update = () => {
      if (!hintEl) return;
      if (!inputEl.value.trim()) {
        hintEl.textContent = "";
        hintEl.className = "validation-hint";
        return;
      }
      const res = validateOAB(inputEl.value);
      hintEl.textContent = res.message;
      hintEl.className = `validation-hint ${res.valid ? "valid" : "invalid"}`;
    };
    inputEl.addEventListener("input", update);
    inputEl.addEventListener("blur", () => {
      const res = validateOAB(inputEl.value);
      if (res.valid) inputEl.value = res.normalized;
      update();
    });
  }

  return {
    maskCPF,
    validateCPF,
    validateOAB,
    maskPhone,
    bindCPFInput,
    bindOABInput
  };
})();
