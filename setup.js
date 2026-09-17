const CONFIG = window.TARJETASNFC_CONFIG || {};
const status = document.querySelector("#setup-status");
const authStage = document.querySelector("#auth-stage");
const configStage = document.querySelector("#config-stage");
const authForm = document.querySelector("#auth-form");
const cardForm = document.querySelector("#card-form");
const email = document.querySelector("#email");
const cardId = document.querySelector("#card-id");
const redirectUrl = document.querySelector("#redirect-url");
const logout = document.querySelector("#logout");
const supabaseUrl = CONFIG.supabaseUrl || "";
const supabaseAnonKey = CONFIG.supabaseAnonKey || "";
const initialCardId = new URLSearchParams(location.search).get("card") || "";
let suppressAuthRender = false;

cardId.value = initialCardId;

if (!supabaseUrl || !supabaseAnonKey) {
  showStage(null);
  notify("Falta configurar Supabase en este sitio.", "error");
} else {
  initSetup();
}

async function initSetup() {
  const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const redirectTo = `${location.origin}${location.pathname}${location.search}`;
    notify("Enviando enlace mágico...", "loading");
    const { error } = await supabase.auth.signInWithOtp({ email: email.value, options: { emailRedirectTo: redirectTo } });
    notify(error ? "No se pudo enviar el enlace. Revisa el email." : "Te hemos enviado un enlace mágico para entrar.", error ? "error" : "success");
  });

  cardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const target = redirectUrl.value.trim();
    const id = cardId.value.trim();

    if (!isCardId(id)) {
      notify("El ID de tarjeta sólo puede usar letras, números, guiones y guiones bajos.", "error");
      return;
    }

    if (!isHttpUrl(target)) {
      notify("La URL debe empezar por http:// o https://.", "error");
      return;
    }

    notify("Guardando destino...", "loading");
    const { data: { user } } = await supabase.auth.getUser();
    const row = { card_id: id, redirect_url: target, owner_id: user.id };
    const { error } = await supabase.from("cards").upsert(row, { onConflict: "card_id" });

    notify(error ? "No se pudo guardar. Comprueba que esta tarjeta sea tuya o esté libre." : "Destino guardado. El QR ya redirige a esa URL.", error ? "error" : "success");
  });

  logout.addEventListener("click", async () => {
    notify("Cerrando sesión...", "loading");
    suppressAuthRender = true;
    await supabase.auth.signOut();
    await render(supabase, { message: "Has cerrado sesión. Entra de nuevo para configurar una tarjeta.", type: "success" });
    suppressAuthRender = false;
  });

  supabase.auth.onAuthStateChange(() => {
    if (!suppressAuthRender) render(supabase);
  });
  await render(supabase);
}

async function render(supabase, statusOverride) {
  const { data: { session } } = await supabase.auth.getSession();
  showStage(session ? "config" : "auth");

  if (!session) {
    notify(statusOverride?.message || "Entra con tu email para configurar esta tarjeta.", statusOverride?.type || "loading");
    return;
  }

  notify("Sesión detectada. Ya puedes configurar tu tarjeta.", "success");

  const id = cardId.value.trim();
  if (!id) return;

  if (!isCardId(id)) {
    notify("El ID de tarjeta recibido no es válido.", "error");
    return;
  }

  notify("Cargando destino actual de la tarjeta...", "loading");

  const { data, error } = await supabase
    .from("cards")
    .select("redirect_url")
    .eq("card_id", id)
    .maybeSingle();

  if (error) {
    notify("No se pudo cargar el destino actual de esta tarjeta.", "error");
    return;
  }

  if (data?.redirect_url) {
    redirectUrl.value = data.redirect_url;
    notify(`Destino actual cargado: ${data.redirect_url}`, "success");
  } else {
    notify("Esta tarjeta todavía no tiene destino guardado.", "success");
  }
}

function showStage(stage) {
  authStage.hidden = stage !== "auth";
  configStage.hidden = stage !== "config";
}

function notify(message, type) {
  status.textContent = message;
  status.className = `setup-status setup-status-${type}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isCardId(value) {
  return /^[A-Za-z0-9_-]{3,64}$/.test(value);
}
