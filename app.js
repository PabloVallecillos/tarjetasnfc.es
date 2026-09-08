/* ============ TarjetasNFC — config de contacto ============
   CAMBIA AQUÍ tus datos reales:
   - whatsapp: número con código de país, sin "+" ni espacios (ej: "34600123456")
   - telegram: tu usuario de Telegram (ej: "tarjetasnfc")
   - email: tu correo de contacto
*/
const CONTACT = {
  whatsapp: "34687615012",
  whatsappText: "Hola! Quiero información sobre una tarjeta NFC para mi negocio.",
  telegram: "vallecillosmoya",
  email: "quieromistarjetasnfc@gmail.com",
  emailSubject: "Quiero una tarjeta NFC",
};

const GOOGLE_PLACES_API_KEY = window.TARJETASNFC_CONFIG?.googlePlacesApiKey || "";

function startApp() {
  // Rellenar enlaces de contacto
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappText)}`;
  const tg = `https://t.me/${CONTACT.telegram}`;
  const mail = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}`;

  document.querySelectorAll('[data-contact="whatsapp"]').forEach((a) => (a.href = wa));
  document.querySelectorAll('[data-contact="telegram"]').forEach((a) => (a.href = tg));
  document.querySelectorAll('[data-contact="email"]').forEach((a) => {
    a.href = mail;
    a.textContent = CONTACT.email; // el email visible también (legal/privacidad)
  });

  // Año en el footer
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  initReviewLinkGenerator();

  // Animación de aparición al hacer scroll
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}

function initReviewLinkGenerator() {
  const generator = document.querySelector("#generador-resenas");
  const searchWrap = document.querySelector("#place-search");
  const status = document.querySelector("#review-status");
  const result = document.querySelector(".review-result");
  const link = document.querySelector("#review-link");
  const copy = document.querySelector("[data-copy-review]");
  const open = document.querySelector("[data-open-review]");
  const copyGenerator = document.querySelector("[data-copy-generator]");
  const qr = document.querySelector("#review-qr");
  const downloadCard = document.querySelector("[data-download-card]");

  if (!generator || !searchWrap || !status || !result || !link || !copy || !open || !copyGenerator || !qr || !downloadCard) return;

  let placeAutocomplete;
  let currentPlaceName = "tu negocio";

  const focusFromHash = () => {
    if (location.hash !== "#generador-resenas") return;
    generator.scrollIntoView({ block: "start" });
    try {
      if (placeAutocomplete) placeAutocomplete.focus();
    } catch {
      // Focus is a UX enhancement; the generator must still work if the web component rejects it.
    }
  };

  const showGoogleSetupError = () => {
    searchWrap.hidden = true;
    status.textContent = "No se pudo activar la búsqueda de Google. Habilita Maps JavaScript API y Places API en Google Cloud, y restringe la clave para este dominio.";
  };

  focusFromHash();

  if (!GOOGLE_PLACES_API_KEY) {
    status.textContent = "Para activar esta búsqueda, crea config.js con la clave pública restringida de Google Places.";
    return;
  }

  loadGooglePlaces()
    .then((places) => {
      const PlaceAutocompleteElement = places.PlaceAutocompleteElement || google.maps.places?.PlaceAutocompleteElement;
      if (!PlaceAutocompleteElement) throw new Error("Google Places autocomplete unavailable");

      placeAutocomplete = new PlaceAutocompleteElement({
        includedPrimaryTypes: ["establishment"],
      });
      searchWrap.replaceChildren(placeAutocomplete);
      searchWrap.hidden = false;
      status.textContent = "Busca tu negocio y selecciónalo de la lista de Google.";
      focusFromHash();

      placeAutocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
        let place;

        try {
          place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["id", "displayName"] });
        } catch {
          showGoogleSetupError();
          return;
        }

        if (!place.id) {
          status.textContent = "Selecciona un resultado de Google para generar el enlace.";
          return;
        }

        const reviewUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(place.id)}`;
        const qrUrl = `https://quickchart.io/qr?size=320&margin=2&text=${encodeURIComponent(reviewUrl)}`;
        currentPlaceName = place.displayName || "tu negocio";
        link.value = reviewUrl;
        open.href = reviewUrl;
        qr.crossOrigin = "anonymous";
        qr.src = qrUrl;
        qr.alt = `QR del enlace de reseña de ${currentPlaceName}`;
        result.hidden = false;
        status.textContent = `Enlace generado para ${currentPlaceName}.`;
      });
    })
    .catch(showGoogleSetupError);

  copy.addEventListener("click", async () => {
    if (!link.value) return;

    try {
      await navigator.clipboard.writeText(link.value);
      status.textContent = "Enlace copiado al portapapeles.";
    } catch {
      link.select();
      document.execCommand("copy");
      status.textContent = "Enlace seleccionado para copiar.";
    }
  });

  copyGenerator.addEventListener("click", async () => {
    const generatorUrl = `${location.origin}${location.pathname}#generador-resenas`;

    try {
      await navigator.clipboard.writeText(generatorUrl);
      status.textContent = "Enlace al generador copiado al portapapeles.";
    } catch {
      status.textContent = `Enlace directo al generador: ${generatorUrl}`;
    }
  });

  downloadCard.addEventListener("click", async () => {
    if (!qr.src) return;

    try {
      const url = await createReviewCardImage(qr.src, currentPlaceName);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cartel-resena-google-nfc-qr.png";
      a.click();
      URL.revokeObjectURL(url);
      status.textContent = "Cartel NFC + QR descargado.";
    } catch {
      status.textContent = "No se pudo descargar el cartel. Usa el botón Abrir enlace para guardar el QR.";
    }
  });

  window.addEventListener("hashchange", focusFromHash);
}

async function createReviewCardImage(qrSrc, placeName) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  const qrImage = await loadImage(qrSrc);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  roundedStroke(ctx, 35, 35, 1010, 1430, 34, "#16a34a", 8);
  drawGoogleBars(ctx, 55, 35, 970);

  ctx.textAlign = "center";
  ctx.fillStyle = "#050505";
  ctx.font = "900 88px Inter, Arial, sans-serif";
  ctx.fillText("Déjanos tu", 540, 150);
  ctx.fillText("reseña en Google", 540, 255);
  ctx.font = "500 38px Inter, Arial, sans-serif";
  ctx.fillStyle = "#27272a";
  ctx.fillText("Tu opinión nos ayuda a mejorar", 540, 345);
  ctx.fillText("y a que otros clientes nos encuentren.", 540, 392);
  ctx.font = "72px Arial, sans-serif";
  ctx.fillStyle = "#facc15";
  ctx.fillText("★★★★★", 540, 490);

  drawPanel(ctx, 70, 545, 510, 405, "#2563eb", "Opción 1: NFC", "Acerca tu móvil aquí", "Pega aquí\nla pegatina NFC");
  drawPanel(ctx, 610, 545, 400, 405, "#16a34a", "Opción 2: QR", "Escanea este QR", "");
  ctx.drawImage(qrImage, 690, 695, 240, 240);

  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText("1  Desbloquea tu móvil", 540, 1055);
  ctx.fillText("2  Acércalo a la pegatina o escanea el QR", 540, 1130);
  ctx.fillText("3  Se abrirá Google para dejar tu reseña", 540, 1205);

  ctx.fillStyle = "#1d4ed8";
  ctx.font = "900 62px Inter, Arial, sans-serif";
  ctx.fillText("¡Gracias por tu apoyo!", 540, 1340);
  ctx.fillStyle = "#52525b";
  ctx.font = "500 28px Inter, Arial, sans-serif";
  ctx.fillText(placeName, 540, 1405);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject()), "image/png");
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedStroke(ctx, x, y, w, h, r, color, lineWidth) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawGoogleBars(ctx, x, y, width) {
  const colors = ["#2563eb", "#dc2626", "#facc15", "#16a34a"];
  const segment = width / colors.length - 12;
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + index * (segment + 16), y, segment, 8);
  });
}

function drawPanel(ctx, x, y, w, h, color, title, subtitle, centerText) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 45, y + 25, w - 90, 70, 35);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 40px Inter, Arial, sans-serif";
  ctx.fillText(title, x + w / 2, y + 74);
  ctx.fillStyle = color;
  ctx.font = "800 38px Inter, Arial, sans-serif";
  ctx.fillText(subtitle, x + w / 2, y + 155);
  if (centerText) {
    ctx.strokeStyle = color;
    ctx.setLineDash([14, 16]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 275, 105, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "700 30px Inter, Arial, sans-serif";
    centerText.split("\n").forEach((line, i) => ctx.fillText(line, x + w / 2, y + 270 + i * 38));
  }
}

function loadGooglePlaces() {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) return Promise.resolve(google.maps.places);
  if (window.google?.maps?.importLibrary) return google.maps.importLibrary("places").then(normalizePlacesLibrary);

  return new Promise((resolve, reject) => {
    window.gm_authFailure = () => reject(new Error("Google Maps auth failure"));

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_PLACES_API_KEY)}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        resolve(google.maps.places);
        return;
      }

      if (window.google?.maps?.importLibrary) {
        google.maps.importLibrary("places").then((places) => resolve(normalizePlacesLibrary(places)), reject);
        return;
      }

      reject(new Error("Google Places library unavailable"));
    };
    script.onerror = reject;
    document.head.append(script);
  });
}

async function normalizePlacesLibrary(places) {
  for (let i = 0; i < 20; i += 1) {
    const PlaceAutocompleteElement = places?.PlaceAutocompleteElement || window.google?.maps?.places?.PlaceAutocompleteElement;
    if (PlaceAutocompleteElement) return { ...places, PlaceAutocompleteElement };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return places || {};
}
