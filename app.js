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
let googlePlacesPromise;

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

  const mountAutocomplete = (attempt = 0) => {
    loadGooglePlaces()
      .then((places) => {
        const PlaceAutocompleteElement = places.PlaceAutocompleteElement || google.maps.places?.PlaceAutocompleteElement;
        if (!PlaceAutocompleteElement) throw new Error("Google Places autocomplete unavailable");

        placeAutocomplete = new PlaceAutocompleteElement({
          includedPrimaryTypes: ["establishment"],
        });
        placeAutocomplete.id = "place-autocomplete";
        placeAutocomplete.setAttribute("name", "place-autocomplete");
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
      .catch(() => {
        if (attempt < 20) {
          setTimeout(() => mountAutocomplete(attempt + 1), 100);
          return;
        }

        showGoogleSetupError();
      });
  };

  mountAutocomplete();

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
  roundedStroke(ctx, 35, 35, 1010, 1430, 34, "#22c55e", 8);
  drawGoogleBars(ctx, 55, 35, 970);

  ctx.textAlign = "center";
  drawGoogleTitle(ctx, 540, 145);
  ctx.font = "500 38px Inter, Arial, sans-serif";
  ctx.fillStyle = "#27272a";
  ctx.fillText("Tu opinión nos ayuda a mejorar y a que", 540, 280);
  ctx.fillText("otros clientes nos encuentren.", 540, 328);
  ctx.font = "72px Arial, sans-serif";
  ctx.fillStyle = "#facc15";
  ctx.fillText("★★★★★", 540, 430);

  drawNfcPanel(ctx, 70, 505, 460, 455);
  drawQrPanel(ctx, 555, 505, 455, 455, qrImage);

  ctx.font = "700 30px Inter, Arial, sans-serif";
  ctx.fillStyle = "#52525b";
  ctx.fillText("Compatible con la mayoría de móviles con NFC", 540, 1025);

  ctx.font = "800 31px Inter, Arial, sans-serif";
  ctx.fillStyle = "#111827";
  drawStepBox(ctx, 80, 1070, "1", "Desbloquea", "tu móvil");
  drawStepBox(ctx, 390, 1070, "2", "Acércalo", "o escanea");
  drawStepBox(ctx, 700, 1070, "3", "Se abre", "Google reseñas");

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(85, 1270, 910, 120, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px Inter, Arial, sans-serif";
  ctx.fillText("Consíguela en tarjetasnfc.es", 540, 1322);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 28px Inter, Arial, sans-serif";
  ctx.fillText("Tu negocio, más cerca de tus clientes", 540, 1362);

  ctx.fillStyle = "#52525b";
  ctx.font = "500 24px Inter, Arial, sans-serif";
  ctx.fillText(placeName, 540, 1432);

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

function drawGoogleTitle(ctx, x, y) {
  ctx.fillStyle = "#050505";
  ctx.font = "900 78px Inter, Arial, sans-serif";
  ctx.fillText("Déjanos tu reseña en", x, y);

  const letters = [
    ["G", "#4285f4"],
    ["o", "#ea4335"],
    ["o", "#fbbc05"],
    ["g", "#4285f4"],
    ["l", "#34a853"],
    ["e", "#ea4335"],
  ];
  ctx.font = "900 86px Inter, Arial, sans-serif";
  let left = x - letters.reduce((total, [letter]) => total + ctx.measureText(letter).width, 0) / 2;
  letters.forEach(([letter, color]) => {
    ctx.fillStyle = color;
    ctx.fillText(letter, left + ctx.measureText(letter).width / 2, y + 90);
    left += ctx.measureText(letter).width;
  });
}

function drawNfcPanel(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fillStyle = "#2563eb";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px Inter, Arial, sans-serif";
  ctx.fillText("Opción 1: NFC", x + w / 2, y + 60);
  ctx.font = "800 34px Inter, Arial, sans-serif";
  ctx.fillText("Acerca tu móvil aquí", x + w / 2, y + 116);

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(x + 58, y + 150, 135, 205, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x + 70, y + 166, 111, 173, 18);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.font = "700 20px Arial, sans-serif";
  ctx.fillText("★★★★★", x + 126, y + 225);
  ctx.fillStyle = "#111827";
  ctx.font = "800 18px Inter, Arial, sans-serif";
  ctx.fillText("Reseña", x + 126, y + 260);
  ctx.fillText("Google", x + 126, y + 286);
  drawNfcWaves(ctx, x + 210, y + 245);

  ctx.strokeStyle = "#ffffff";
  ctx.setLineDash([12, 14]);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x + 330, y + 260, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 24px Inter, Arial, sans-serif";
  ctx.fillText("Pega aquí", x + 330, y + 250);
  ctx.fillText("la pegatina NFC", x + 330, y + 282);
}

function drawQrPanel(ctx, x, y, w, h, qrImage) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fillStyle = "#16a34a";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px Inter, Arial, sans-serif";
  ctx.fillText("Opción 2: QR", x + w / 2, y + 60);
  ctx.font = "800 30px Inter, Arial, sans-serif";
  ctx.fillText("Si no te funciona el NFC,", x + w / 2, y + 116);
  ctx.fillText("escanea este QR", x + w / 2, y + 154);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x + 100, y + 182, 255, 255, 28);
  ctx.fill();
  ctx.strokeStyle = "#dcfce7";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.drawImage(qrImage, x + 125, y + 207, 205, 205);
}

function drawNfcWaves(ctx, x, y) {
  ctx.strokeStyle = "rgba(255, 255, 255, .9)";
  ctx.lineWidth = 6;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x, y, 32 + i * 24, -0.85, 0.85);
    ctx.stroke();
  }
}

function drawStepBox(ctx, x, y, number, line1, line2) {
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.roundRect(x, y, 280, 120, 20);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.arc(x + 46, y + 60, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px Inter, Arial, sans-serif";
  ctx.fillText(number, x + 46, y + 71);
  ctx.fillStyle = "#111827";
  ctx.font = "800 27px Inter, Arial, sans-serif";
  ctx.fillText(line1, x + 165, y + 52);
  ctx.fillText(line2, x + 165, y + 88);
}

function loadGooglePlaces() {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) return Promise.resolve(google.maps.places);
  if (window.google?.maps?.importLibrary) return google.maps.importLibrary("places").then(normalizePlacesLibrary);
  if (googlePlacesPromise) return googlePlacesPromise;

  googlePlacesPromise = new Promise((resolve, reject) => {
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

  return googlePlacesPromise;
}

async function normalizePlacesLibrary(places) {
  for (let i = 0; i < 20; i += 1) {
    const PlaceAutocompleteElement = places?.PlaceAutocompleteElement || window.google?.maps?.places?.PlaceAutocompleteElement;
    if (PlaceAutocompleteElement) return { ...places, PlaceAutocompleteElement };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return places || {};
}
