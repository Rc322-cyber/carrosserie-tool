const currency = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
});

const GENERATED_RATES = {
  paintMaterials: 0.605,
  smallMaterials: 0.01,
  environment: 0.02,
};

const COMPANIES_STORAGE_KEY = "xpertlink_companies";

const elements = {
  authPanel: document.getElementById("auth-panel"),
  blockedPanel: document.getElementById("blocked-panel"),
  blockedMessage: document.getElementById("blocked-message"),
  blockedLogoutButton: document.getElementById("blocked-logout-button"),
  appContent: document.getElementById("app-content"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  loginButton: document.getElementById("login-button"),
  registerButton: document.getElementById("register-button"),
  googleLoginButton: document.getElementById("google-login-button"),
  logoutButton: document.getElementById("logout-button"),
  authStatus: document.getElementById("auth-status"),
  authError: document.getElementById("auth-error"),
  userEmail: document.getElementById("user-email"),
  addLine: document.getElementById("add-line"),
  buildEstimate: document.getElementById("build-estimate"),
  printEstimate: document.getElementById("print-estimate"),
  recalculateLines: document.getElementById("recalculate-lines"),
  lineItems: document.getElementById("line-items"),
  lineTemplate: document.getElementById("line-template"),
  insurerRateToggle: document.getElementById("insurer-rate-toggle"),
  rateLabor: document.getElementById("rate-labor"),
  ratePaint: document.getElementById("rate-paint"),
  smallMaterialsEnabled: document.getElementById("small-materials-enabled"),
  environmentEnabled: document.getElementById("environment-enabled"),
  paintMaterialsEnabled: document.getElementById("paint-materials-enabled"),
  antiRustEnabled: document.getElementById("anti-rust-enabled"),
  smallMaterialsValue: document.getElementById("small-materials-value"),
  smallMaterialsMeta: document.getElementById("small-materials-meta"),
  environmentValue: document.getElementById("environment-value"),
  environmentMeta: document.getElementById("environment-meta"),
  paintMaterialsValue: document.getElementById("paint-materials-value"),
  antiRustValue: document.getElementById("anti-rust-value"),
  totalDisassembly: document.getElementById("total-disassembly"),
  totalBodywork: document.getElementById("total-bodywork"),
  totalPaint: document.getElementById("total-paint"),
  totalLabor: document.getElementById("total-labor"),
  totalParts: document.getElementById("total-parts"),
  totalPaintMaterials: document.getElementById("total-paint-materials"),
  totalSmallMaterials: document.getElementById("total-small-materials"),
  totalEnvironment: document.getElementById("total-environment"),
  totalAntiRust: document.getElementById("total-anti-rust"),
  grandTotal: document.getElementById("grand-total"),
  remarks: document.getElementById("remarks"),
  settingsCompanyName: document.getElementById("settings-company-name"),
  settingsCompanyAddress: document.getElementById("settings-company-address"),
  settingsCompanyVat: document.getElementById("settings-company-vat"),
  settingsCompanyPhone: document.getElementById("settings-company-phone"),
  settingsCompanyEmail: document.getElementById("settings-company-email"),
  settingsCompanyLogo: document.getElementById("settings-company-logo"),
  saveCompanySettings: document.getElementById("save-company-settings"),
  companySettingsSuccess: document.getElementById("company-settings-success"),
  customerName: document.getElementById("customer-name"),
  customerAddress: document.getElementById("customer-address"),
  customerPhone: document.getElementById("customer-phone"),
  customerEmail: document.getElementById("customer-email"),
  customerVat: document.getElementById("customer-vat"),
  vehicleBrand: document.getElementById("vehicle-brand"),
  vehicleModel: document.getElementById("vehicle-model"),
  vehiclePlate: document.getElementById("vehicle-plate"),
  vehicleChassis: document.getElementById("vehicle-chassis"),
  vehicleRegistrationDate: document.getElementById("vehicle-registration-date"),
  vehicleMileage: document.getElementById("vehicle-mileage"),
  documentNumber: document.getElementById("document-number"),
  documentDate: document.getElementById("document-date"),
  companyName: document.getElementById("company-name"),
  companyVat: document.getElementById("company-vat"),
  vatRate: document.getElementById("vat-rate"),
  estimateOutput: document.getElementById("estimate-output"),
  estimateCompanyLogo: document.getElementById("estimate-company-logo"),
  estimateCompanyName: document.getElementById("estimate-company-name"),
  estimateCompanyAddress: document.getElementById("estimate-company-address"),
  estimateCompanyVat: document.getElementById("estimate-company-vat"),
  estimateCompanyPhone: document.getElementById("estimate-company-phone"),
  estimateCompanyEmail: document.getElementById("estimate-company-email"),
  estimateCompanyWebsite: document.getElementById("estimate-company-website"),
  estimateCompanyIbanBic: document.getElementById("estimate-company-iban-bic"),
  estimateDocumentNumber: document.getElementById("estimate-document-number"),
  estimateDocumentDate: document.getElementById("estimate-document-date"),
  estimateVatRate: document.getElementById("estimate-vat-rate"),
  estimateCustomerName: document.getElementById("estimate-customer-name"),
  estimateCustomerAddress: document.getElementById("estimate-customer-address"),
  estimateCustomerPhone: document.getElementById("estimate-customer-phone"),
  estimateCustomerEmail: document.getElementById("estimate-customer-email"),
  estimateCustomerVat: document.getElementById("estimate-customer-vat"),
  estimateVehicleBrandModel: document.getElementById("estimate-vehicle-brand-model"),
  estimateVehiclePlate: document.getElementById("estimate-vehicle-plate"),
  estimateVehicleChassis: document.getElementById("estimate-vehicle-chassis"),
  estimateVehicleRegistrationDate: document.getElementById("estimate-vehicle-registration-date"),
  estimateVehicleMileage: document.getElementById("estimate-vehicle-mileage"),
  estimateRemarks: document.getElementById("estimate-remarks"),
  estimateLinesBody: document.getElementById("estimate-lines-body"),
  estimateSubtotal: document.getElementById("estimate-subtotal"),
  estimateVatAmount: document.getElementById("estimate-vat-amount"),
  estimateTotalInclVat: document.getElementById("estimate-total-incl-vat"),
};

let currentUser = null;
let companyLogoDataUrl = "";
let companySettingsMessageTimeout = null;
let companyLogoReadPromise = Promise.resolve();
let linkedCompanyProfile = null;
let activeGeneratedRates = { ...GENERATED_RATES };

function getCompanySettingsStorageKey(userId) {
  return `companySettings_${userId}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function loadCompaniesFromStorage() {
  try {
    const rawCompanies = window.localStorage.getItem(COMPANIES_STORAGE_KEY);
    const companies = rawCompanies ? JSON.parse(rawCompanies) : [];
    return Array.isArray(companies) ? companies : [];
  } catch (error) {
    console.error("Kon bedrijven niet laden.", error);
    return [];
  }
}

function formatPercentageLabel(value) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
}

function updateGeneratedRateLabels() {
  elements.smallMaterialsMeta.textContent = `Auto ${formatPercentageLabel(
    activeGeneratedRates.smallMaterials * 100
  )}%`;
  elements.environmentMeta.textContent = `Auto ${formatPercentageLabel(
    activeGeneratedRates.environment * 100
  )}%`;
}

function formatCompanyAddressFromProfile(profile = {}) {
  const locality = [profile.postalCode, profile.city].filter(Boolean).join(" ");
  return [profile.street, locality, profile.country].filter(Boolean).join(", ");
}

function formatCompanyIbanBic(profile = {}) {
  const parts = [];

  if (profile.iban) {
    parts.push(`IBAN: ${profile.iban}`);
  }

  if (profile.bic) {
    parts.push(`BIC: ${profile.bic}`);
  }

  return parts.join(" | ");
}

function toggleOptionalEstimateLine(element, text) {
  const hasText = Boolean(text?.trim());
  element.textContent = hasText ? text : "";
  element.classList.toggle("hidden", !hasText);
}

function createDocumentNumberFromPrefix(prefix) {
  const trimmedPrefix = prefix?.trim();
  if (!trimmedPrefix) {
    return "";
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${trimmedPrefix}-${year}${month}${day}`;
}

function setBlockedState(isBlocked, message = "") {
  elements.blockedPanel.classList.toggle("hidden", !isBlocked);

  if (isBlocked) {
    elements.authPanel.classList.add("hidden");
    elements.appContent.classList.add("hidden");
    elements.blockedMessage.textContent = message;
  }
}

function getLinkedCompanyProfile(userEmail) {
  const normalizedEmail = normalizeEmail(userEmail);

  if (!normalizedEmail) {
    return null;
  }

  return (
    loadCompaniesFromStorage().find(
      (company) => normalizeEmail(company.userEmail) === normalizedEmail
    ) || null
  );
}

function hideCompanySettingsSuccess() {
  elements.companySettingsSuccess.textContent = "";
  elements.companySettingsSuccess.classList.add("hidden");
}

function showCompanySettingsSuccess(message) {
  if (companySettingsMessageTimeout) {
    window.clearTimeout(companySettingsMessageTimeout);
  }

  elements.companySettingsSuccess.textContent = message;
  elements.companySettingsSuccess.classList.remove("hidden");
  companySettingsMessageTimeout = window.setTimeout(() => {
    hideCompanySettingsSuccess();
  }, 2500);
}

function getCompanySettingsFromForm() {
  return {
    name: elements.settingsCompanyName.value.trim(),
    address: elements.settingsCompanyAddress.value.trim(),
    vat: elements.settingsCompanyVat.value.trim(),
    phone: elements.settingsCompanyPhone.value.trim(),
    email: elements.settingsCompanyEmail.value.trim(),
    logo: companyLogoDataUrl,
  };
}

function applyCompanySettingsToForm(settings = {}) {
  elements.settingsCompanyName.value = settings.name || "";
  elements.settingsCompanyAddress.value = settings.address || "";
  elements.settingsCompanyVat.value = settings.vat || "";
  elements.settingsCompanyPhone.value = settings.phone || "";
  elements.settingsCompanyEmail.value = settings.email || "";
  elements.settingsCompanyLogo.value = "";
  companyLogoDataUrl = settings.logo || "";
  elements.companyName.value = settings.name || "";
  elements.companyVat.value = settings.vat || "";
}

function resetCompanySettingsForm() {
  applyCompanySettingsToForm();
  hideCompanySettingsSuccess();
}

function applyLinkedCompanyProfileToCalculator(profile) {
  linkedCompanyProfile = profile || null;

  if (!profile) {
    activeGeneratedRates = { ...GENERATED_RATES };
    updateGeneratedRateLabels();
    return;
  }

  const companySettings = {
    name: profile.name || "",
    address: formatCompanyAddressFromProfile(profile),
    vat: profile.vat || "",
    phone: profile.phone || "",
    email: profile.email || "",
    logo: profile.logo || "",
  };

  applyCompanySettingsToForm(companySettings);

  if (profile.defaultRateLabor?.trim()) {
    elements.rateLabor.value = profile.defaultRateLabor;
  }

  if (profile.defaultRatePaint?.trim()) {
    elements.ratePaint.value = profile.defaultRatePaint;
  }

  if (profile.defaultVatRate?.trim()) {
    elements.vatRate.value = profile.defaultVatRate;
  }

  activeGeneratedRates = {
    paintMaterials: GENERATED_RATES.paintMaterials,
    smallMaterials: profile.smallMaterialsPercentage?.trim()
      ? toNumber(profile.smallMaterialsPercentage) / 100
      : GENERATED_RATES.smallMaterials,
    environment: profile.environmentPercentage?.trim()
      ? toNumber(profile.environmentPercentage) / 100
      : GENERATED_RATES.environment,
  };

  updateGeneratedRateLabels();

  if (profile.estimatePrefix?.trim() && !elements.documentNumber.value.trim()) {
    elements.documentNumber.value = createDocumentNumberFromPrefix(profile.estimatePrefix);
  }
}

function loadCompanySettings(user) {
  if (!user?.uid) {
    resetCompanySettingsForm();
    return;
  }

  const storageKey = getCompanySettingsStorageKey(user.uid);

  try {
    const rawSettings = window.localStorage.getItem(storageKey);
    const parsedSettings = rawSettings ? JSON.parse(rawSettings) : {};
    applyCompanySettingsToForm(parsedSettings);
  } catch (error) {
    console.error("Kon bedrijfsinstellingen niet laden.", error);
    resetCompanySettingsForm();
  }
}

async function saveCompanySettings() {
  if (!currentUser?.uid) {
    showAuthError("Log eerst in om bedrijfsinstellingen op te slaan.");
    return;
  }

  try {
    await companyLogoReadPromise;
    const settings = getCompanySettingsFromForm();
    window.localStorage.setItem(
      getCompanySettingsStorageKey(currentUser.uid),
      JSON.stringify(settings)
    );
    applyCompanySettingsToForm(settings);
    showCompanySettingsSuccess("Bedrijfsgegevens opgeslagen.");
  } catch (error) {
    showAuthError("Opslaan van bedrijfsinstellingen mislukt.");
    console.error("Kon bedrijfsinstellingen niet opslaan.", error);
  }
}

function handleCompanyLogoUpload(file) {
  if (!file) {
    companyLogoDataUrl = "";
    companyLogoReadPromise = Promise.resolve();
    return;
  }

  const reader = new FileReader();
  companyLogoReadPromise = new Promise((resolve, reject) => {
    reader.onload = () => {
      companyLogoDataUrl = typeof reader.result === "string" ? reader.result : "";
      resolve(companyLogoDataUrl);
    };
    reader.onerror = () => {
      showAuthError("Logo uploaden mislukt.");
      reject(new Error("Logo uploaden mislukt."));
    };
  });
  reader.readAsDataURL(file);
}

function showAuthError(message) {
  elements.authError.textContent = message;
  elements.authError.classList.remove("hidden");
}

function clearAuthError() {
  elements.authError.textContent = "";
  elements.authError.classList.add("hidden");
}

function setAuthMode(isLoggedIn, user) {
  elements.authPanel.classList.toggle("hidden", isLoggedIn);
  elements.appContent.classList.toggle("hidden", !isLoggedIn);
  elements.logoutButton.classList.toggle("hidden", !isLoggedIn);
  elements.blockedPanel.classList.add("hidden");
  elements.userEmail.textContent = isLoggedIn ? user?.email || "Aangemeld" : "Professionele schatting";
  elements.authStatus.textContent = isLoggedIn
    ? `Ingelogd als ${user?.email || "gebruiker"}.`
    : "Niet ingelogd.";

  if (!isLoggedIn) {
    elements.authPassword.value = "";
  }
}

async function handleAuthAction(action) {
  clearAuthError();

  try {
    await action();
  } catch (error) {
    showAuthError(error?.message || "Authenticatie mislukt.");
  }
}

function setupAuth() {
  if (typeof firebase === "undefined" || typeof firebase.auth !== "function") {
    showAuthError("Firebase Auth is niet beschikbaar. Controleer de configuratie.");
    setAuthMode(false);
    return;
  }

  const auth = firebase.auth();

  elements.loginButton.addEventListener("click", () => {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;

    handleAuthAction(() => auth.signInWithEmailAndPassword(email, password));
  });

  if (elements.registerButton) {
    elements.registerButton.addEventListener("click", () => {
      const email = elements.authEmail.value.trim();
      const password = elements.authPassword.value;

      handleAuthAction(() => auth.createUserWithEmailAndPassword(email, password));
    });
  }

  if (elements.googleLoginButton) {
    elements.googleLoginButton.addEventListener("click", () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      handleAuthAction(() => auth.signInWithPopup(provider));
    });
  }

  elements.logoutButton.addEventListener("click", () => {
    handleAuthAction(() => auth.signOut());
  });

  elements.blockedLogoutButton.addEventListener("click", () => {
    handleAuthAction(() => auth.signOut());
  });

  auth.onAuthStateChanged(async (user) => {
    clearAuthError();
    currentUser = user || null;
    setAuthMode(Boolean(user), user);
    loadCompanySettings(user);

    if (!user) {
      linkedCompanyProfile = null;
      activeGeneratedRates = { ...GENERATED_RATES };
      updateGeneratedRateLabels();
      return;
    }

    try {
      await user.reload();
    } catch (error) {
      console.error("Kon gebruiker niet verversen.", error);
    }

    const resolvedUser = auth.currentUser || user;
    const companyProfile = getLinkedCompanyProfile(resolvedUser.email);

    if (String(companyProfile?.status || "").trim().toLowerCase() === "geblokkeerd") {
      linkedCompanyProfile = companyProfile;
      setBlockedState(true, "Uw toegang is geblokkeerd. Contacteer XpertLink.");
      return;
    }

    setBlockedState(false);
    applyLinkedCompanyProfileToCalculator(companyProfile);
    calculate();
  });
}

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return currency.format(value || 0);
}

function formatText(value, fallback = "-") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-BE").format(new Date(value));
}

function aeToLaborCost(aeValue, hourlyRate) {
  return (aeValue / 10) * hourlyRate;
}

function getRates() {
  const laborRate = toNumber(elements.rateLabor.value);
  const insurerRateActive = elements.insurerRateToggle.checked;

  return {
    disassembly: laborRate,
    bodywork: insurerRateActive ? laborRate : laborRate,
    paint: toNumber(elements.ratePaint.value),
  };
}

function createLine(defaults = {}) {
  const fragment = elements.lineTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");

  row.querySelector(".description").value = defaults.description || "";
  row.querySelector(".ae-disassembly").value = defaults.aeDisassembly ?? 0;
  row.querySelector(".ae-bodywork").value = defaults.aeBodywork ?? 0;
  row.querySelector(".ae-paint").value = defaults.aePaint ?? 0;
  row.querySelector(".parts-price").value = defaults.partsPrice ?? 0;

  elements.lineItems.appendChild(fragment);
}

function collectLineData() {
  const rates = getRates();

  return [...elements.lineItems.querySelectorAll("tr")].map((row) => {
    const description = row.querySelector(".description").value.trim();
    const aeDisassembly = toNumber(row.querySelector(".ae-disassembly").value);
    const aeBodywork = toNumber(row.querySelector(".ae-bodywork").value);
    const aePaint = toNumber(row.querySelector(".ae-paint").value);
    const partsPrice = toNumber(row.querySelector(".parts-price").value);
    const lineDisassembly = aeToLaborCost(aeDisassembly, rates.disassembly);
    const lineBodywork = aeToLaborCost(aeBodywork, rates.bodywork);
    const linePaint = aeToLaborCost(aePaint, rates.paint);
    const lineTotal = lineDisassembly + lineBodywork + linePaint + partsPrice;

    return {
      description,
      aeDisassembly,
      aeBodywork,
      aePaint,
      partsPrice,
      lineDisassembly,
      lineBodywork,
      linePaint,
      lineTotal,
    };
  });
}

function getCalculationSnapshot() {
  const lines = collectLineData();

  let laborDisassembly = 0;
  let laborBodywork = 0;
  let laborPaint = 0;
  let totalParts = 0;

  lines.forEach((line) => {
    laborDisassembly += line.lineDisassembly;
    laborBodywork += line.lineBodywork;
    laborPaint += line.linePaint;
    totalParts += line.partsPrice;
  });

  const totalLabor = laborDisassembly + laborBodywork + laborPaint;
  const generatedPaintMaterials = laborPaint * activeGeneratedRates.paintMaterials;
  const generatedSmallMaterials = totalParts * activeGeneratedRates.smallMaterials;
  const generatedEnvironment = totalParts * activeGeneratedRates.environment;

  const paintMaterials = elements.paintMaterialsEnabled.checked ? generatedPaintMaterials : 0;
  const smallMaterials = elements.smallMaterialsEnabled.checked ? generatedSmallMaterials : 0;
  const environment = elements.environmentEnabled.checked ? generatedEnvironment : 0;
  const antiRust = elements.antiRustEnabled.checked ? toNumber(elements.antiRustValue.value) : 0;
  const subtotalExclVat =
    totalLabor + totalParts + paintMaterials + smallMaterials + environment + antiRust;
  const vatRate = toNumber(elements.vatRate.value) / 100;
  const vatAmount = subtotalExclVat * vatRate;
  const totalInclVat = subtotalExclVat + vatAmount;

  return {
    lines,
    laborDisassembly,
    laborBodywork,
    laborPaint,
    totalLabor,
    totalParts,
    generatedPaintMaterials,
    generatedSmallMaterials,
    generatedEnvironment,
    paintMaterials,
    smallMaterials,
    environment,
    antiRust,
    subtotalExclVat,
    vatRate,
    vatAmount,
    totalInclVat,
  };
}

function updateGeneratedFields(values) {
  elements.paintMaterialsValue.value = values.paintMaterials.toFixed(2);
  elements.smallMaterialsValue.value = values.smallMaterials.toFixed(2);
  elements.environmentValue.value = values.environment.toFixed(2);
}

function calculate() {
  const snapshot = getCalculationSnapshot();
  const rows = [...elements.lineItems.querySelectorAll("tr")];

  rows.forEach((row, index) => {
    row.querySelector(".line-total").textContent = formatCurrency(snapshot.lines[index].lineTotal);
  });

  updateGeneratedFields({
    paintMaterials: snapshot.generatedPaintMaterials,
    smallMaterials: snapshot.generatedSmallMaterials,
    environment: snapshot.generatedEnvironment,
  });

  elements.totalDisassembly.textContent = formatCurrency(snapshot.laborDisassembly);
  elements.totalBodywork.textContent = formatCurrency(snapshot.laborBodywork);
  elements.totalPaint.textContent = formatCurrency(snapshot.laborPaint);
  elements.totalLabor.textContent = formatCurrency(snapshot.totalLabor);
  elements.totalParts.textContent = formatCurrency(snapshot.totalParts);
  elements.totalPaintMaterials.textContent = formatCurrency(snapshot.paintMaterials);
  elements.totalSmallMaterials.textContent = formatCurrency(snapshot.smallMaterials);
  elements.totalEnvironment.textContent = formatCurrency(snapshot.environment);
  elements.totalAntiRust.textContent = formatCurrency(snapshot.antiRust);
  elements.grandTotal.textContent = formatCurrency(snapshot.subtotalExclVat);
}

function generateEstimate() {
  const snapshot = getCalculationSnapshot();
  const fragment = document.createDocumentFragment();
  const companySettings = getCompanySettingsFromForm();
  const companyProfile = linkedCompanyProfile;
  const companyAddress =
    companySettings.address || formatCompanyAddressFromProfile(companyProfile || {});
  const companyWebsite = companyProfile?.website?.trim() || "";
  const companyIbanBic = formatCompanyIbanBic(companyProfile || {});

  elements.estimateCompanyName.textContent = formatText(
    companySettings.name || elements.companyName.value
  );
  elements.estimateCompanyAddress.textContent = formatText(companyAddress, "");
  elements.estimateCompanyVat.textContent = `BTW: ${formatText(
    companySettings.vat || elements.companyVat.value
  )}`;
  elements.estimateCompanyPhone.textContent = `Tel: ${formatText(companySettings.phone, "")}`;
  elements.estimateCompanyEmail.textContent = `Email: ${formatText(companySettings.email, "")}`;
  toggleOptionalEstimateLine(
    elements.estimateCompanyWebsite,
    companyWebsite ? `Website: ${companyWebsite}` : ""
  );
  toggleOptionalEstimateLine(
    elements.estimateCompanyIbanBic,
    companyIbanBic
  );
  elements.estimateDocumentNumber.textContent = formatText(elements.documentNumber.value);
  elements.estimateDocumentDate.textContent = formatDate(elements.documentDate.value);
  elements.estimateVatRate.textContent = `${toNumber(elements.vatRate.value).toFixed(2)}%`;

  if (companySettings.logo) {
    elements.estimateCompanyLogo.src = companySettings.logo;
    elements.estimateCompanyLogo.classList.remove("hidden");
  } else {
    elements.estimateCompanyLogo.removeAttribute("src");
    elements.estimateCompanyLogo.classList.add("hidden");
  }

  elements.estimateCustomerName.textContent = formatText(elements.customerName.value);
  elements.estimateCustomerAddress.textContent = formatText(elements.customerAddress.value);
  elements.estimateCustomerPhone.textContent = `Tel: ${formatText(elements.customerPhone.value)}`;
  elements.estimateCustomerEmail.textContent = `Email: ${formatText(elements.customerEmail.value)}`;
  elements.estimateCustomerVat.textContent = `BTW: ${formatText(elements.customerVat.value)}`;

  const brandModel = [elements.vehicleBrand.value.trim(), elements.vehicleModel.value.trim()]
    .filter(Boolean)
    .join(" ");
  elements.estimateVehicleBrandModel.textContent = formatText(brandModel);
  elements.estimateVehiclePlate.textContent = `Nummerplaat: ${formatText(elements.vehiclePlate.value)}`;
  elements.estimateVehicleChassis.textContent = `Chassisnummer: ${formatText(
    elements.vehicleChassis.value
  )}`;
  elements.estimateVehicleRegistrationDate.textContent = `Eerste inschrijving: ${formatDate(
    elements.vehicleRegistrationDate.value
  )}`;
  elements.estimateVehicleMileage.textContent = `Kilometerstand: ${formatText(
    elements.vehicleMileage.value
  )}`;
  elements.estimateRemarks.textContent = formatText(elements.remarks.value);

  elements.estimateLinesBody.replaceChildren();

  if (snapshot.lines.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="6" class="empty-estimate-row">Geen besteklijnen toegevoegd.</td>';
    fragment.appendChild(emptyRow);
  } else {
    snapshot.lines.forEach((line) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatText(line.description)}</td>
        <td>${line.aeDisassembly.toFixed(1)}</td>
        <td>${line.aeBodywork.toFixed(1)}</td>
        <td>${line.aePaint.toFixed(1)}</td>
        <td>${formatCurrency(line.partsPrice)}</td>
        <td>${formatCurrency(line.lineTotal)}</td>
      `;
      fragment.appendChild(row);
    });
  }

  elements.estimateLinesBody.appendChild(fragment);
  elements.estimateSubtotal.textContent = formatCurrency(snapshot.subtotalExclVat);
  elements.estimateVatAmount.textContent = formatCurrency(snapshot.vatAmount);
  elements.estimateTotalInclVat.textContent = formatCurrency(snapshot.totalInclVat);
  elements.estimateOutput.classList.remove("hidden");
}

function buildPrintDocument() {
  const estimateMarkup = elements.estimateOutput.innerHTML;

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bestek print</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --panel-subtle: #f7f9fc;
        --border: #d9e1ea;
        --text: #1e2937;
        --muted: #6b7785;
        --blue: #2474e5;
        --blue-soft: #ebf3ff;
      }

      @page {
        size: A4 portrait;
        margin: 12mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Manrope", sans-serif;
        color: var(--text);
        background: #fff;
      }

      .print-shell {
        width: 100%;
      }

      .panel {
        border: 0;
        box-shadow: none;
        padding: 0;
        margin: 0;
      }

      .section-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 14px;
      }

      h2,
      h3,
      p {
        margin: 0;
      }

      h2 {
        font-size: 16px;
        font-weight: 800;
      }

      h3 {
        font-size: 15px;
        font-weight: 800;
      }

      .estimate-sheet {
        display: grid;
        gap: 18px;
      }

      .estimate-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 20px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border);
      }

      .estimate-branding {
        display: grid;
        gap: 4px;
      }

      .estimate-company-logo {
        display: block;
        max-width: 180px;
        width: auto;
        height: auto;
        margin-bottom: 10px;
        object-fit: contain;
      }

      .estimate-label {
        margin: 0 0 8px;
        color: var(--blue);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .estimate-meta-line {
        margin-top: 6px;
        color: var(--muted);
      }

      .estimate-docbox {
        min-width: 240px;
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel-subtle);
      }

      .estimate-docbox div,
      .estimate-total-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .estimate-docbox span,
      .estimate-total-row span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }

      .estimate-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .estimate-info-card {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel-subtle);
      }

      .estimate-info-card h3 {
        margin-bottom: 10px;
      }

      .estimate-info-card p {
        margin: 0 0 6px;
        line-height: 1.45;
        font-size: 13px;
      }

      .table-wrap {
        overflow: visible;
      }

      .estimate-lines-wrap {
        border: 1px solid var(--border);
        border-radius: 12px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        text-align: left;
        padding: 10px;
        border-bottom: 1px solid #e5ebf1;
        font-size: 12px;
      }

      th {
        background: #f5f7fa;
        color: #5f6d7c;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .estimate-totals {
        margin-left: auto;
        width: min(380px, 100%);
        display: grid;
        gap: 10px;
      }

      .estimate-total-row {
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel-subtle);
      }

      .estimate-total-row.grand {
        background: var(--blue-soft);
        border-color: #c9daf8;
      }

      .empty-estimate-row {
        text-align: center;
        color: var(--muted);
        padding: 18px 12px;
      }

      .hidden {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div class="print-shell">
      <section class="panel">
        ${estimateMarkup}
      </section>
    </div>
  </body>
</html>`;
}

elements.saveCompanySettings.addEventListener("click", saveCompanySettings);
elements.settingsCompanyLogo.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    handleCompanyLogoUpload(target.files?.[0] || null);
  }
});

elements.addLine.addEventListener("click", () => {
  createLine();
  calculate();
});

elements.recalculateLines.addEventListener("click", calculate);
elements.buildEstimate.addEventListener("click", () => {
  calculate();
  generateEstimate();
});
elements.printEstimate.addEventListener("click", () => {
  if (elements.estimateOutput.classList.contains("hidden")) {
    window.alert("Maak eerst een bestek aan");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=1200");

  if (!printWindow) {
    window.alert("Pop-up geblokkeerd. Laat pop-ups toe om het bestek af te drukken.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument());
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
});

elements.lineItems.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement) {
    calculate();
  }
});

elements.lineItems.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.classList.contains("remove-line")) {
    target.closest("tr")?.remove();
    calculate();
  }
});

[
  elements.insurerRateToggle,
  elements.rateLabor,
  elements.ratePaint,
  elements.smallMaterialsEnabled,
  elements.environmentEnabled,
  elements.paintMaterialsEnabled,
  elements.antiRustEnabled,
  elements.antiRustValue,
  elements.vatRate,
].forEach((input) => {
  input.addEventListener("input", calculate);
  input.addEventListener("change", calculate);
});

updateGeneratedRateLabels();
calculate();
setupAuth();
