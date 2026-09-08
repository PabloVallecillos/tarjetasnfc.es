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
  const downloadQr = document.querySelector("[data-download-qr]");
  const openQr = document.querySelector("[data-open-qr]");

  if (!generator || !searchWrap || !status || !result || !link || !copy || !open || !copyGenerator || !qr || !downloadQr || !openQr) return;

  let placeAutocomplete;

  const focusFromHash = () => {
    if (location.hash !== "#generador-resenas") return;
    generator.scrollIntoView({ block: "start" });
    if (placeAutocomplete) placeAutocomplete.focus({ preventScroll: true });
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
    .then(({ PlaceAutocompleteElement }) => {
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
        link.value = reviewUrl;
        open.href = reviewUrl;
        qr.src = qrUrl;
        qr.alt = `QR del enlace de reseña de ${place.displayName || "tu negocio"}`;
        downloadQr.href = qrUrl;
        openQr.href = qrUrl;
        result.hidden = false;
        status.textContent = `Enlace generado para ${place.displayName || "tu negocio"}.`;
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

  window.addEventListener("hashchange", focusFromHash);
}

function loadGooglePlaces() {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) return Promise.resolve(google.maps.places);
  if (window.google?.maps?.importLibrary) return google.maps.importLibrary("places");

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
        google.maps.importLibrary("places").then(resolve, reject);
        return;
      }

      reject(new Error("Google Places library unavailable"));
    };
    script.onerror = reject;
    document.head.append(script);
  });
}
