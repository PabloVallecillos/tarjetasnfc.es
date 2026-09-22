(() => {
  const DESIGNS = {
    "nfcyqr": {
      label: "Verde clásico",
      img: "/assets/nfcyqr.png",
      // QR placement inside dashed box in "Opción 2: QR" panel (1055×1491)
      qr: { x: 642, y: 700, w: 279, h: 260, padding: 32 },
    },
    "nfcgooglesquare": {
      label: "Azul Google",
      img: "/assets/nfcgooglesquare.png",
      printClass: "gen-card-img-large",
      // QR placement in bracket area (1254×1254) — centered
      qr: { x: 765, y: 758, w: 340, h: 340, padding: 0 },
    },
  };

  const form = document.querySelector("#gen-form");
  const output = document.querySelector("#cards-output");
  const btnPrint = document.querySelector("#btn-print");
  const btnList = document.querySelector("#btn-list");
  const actions = document.querySelector("#gen-actions");
  const status = document.querySelector("#gen-status");
  const designSelect = document.querySelector("#design");

  // Populate design selector
  for (const [key, d] of Object.entries(DESIGNS)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = d.label;
    designSelect.appendChild(opt);
  }

  let cards = [];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const count = Math.min(20, Math.max(1, parseInt(document.querySelector("#count").value, 10) || 1));
    const domain = document.querySelector("#domain").value.trim() || "tarjetasnfc.es";
    const designKey = designSelect.value;
    generateCards(count, domain, DESIGNS[designKey]);
  });

  btnPrint.addEventListener("click", () => window.print());
  btnList.addEventListener("click", copyUrls);

  async function generateCards(count, domain, design) {
    output.innerHTML = "";
    cards = [];
    showStatus("Generando tarjetas...", "loading");

    const baseImg = await loadImage(design.img);

    for (let i = 0; i < count; i++) {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const url = `https://${domain}/r/${id}`;
      const qrDataUrl = await makeQR(url);
      const qrImg = await loadImage(qrDataUrl);
      const blobUrl = await composite(baseImg, qrImg, design.qr);

      cards.push({ id, url });

      const img = document.createElement("img");
      img.src = blobUrl;
      img.alt = `Tarjeta ${id}`;
      img.className = "gen-card-img";
      if (design.printClass) img.classList.add(design.printClass);
      output.appendChild(img);
    }

    showStatus(`${count} tarjetas generadas.`, "success");
    actions.hidden = false;
  }

  function composite(baseImg, qrImg, qr) {
    const canvas = document.createElement("canvas");
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImg, 0, 0);

    const qrSize = Math.min(qr.w, qr.h) - qr.padding;
    const qrX = qr.x + (qr.w - qrSize) / 2;
    const qrY = qr.y + (qr.h - qrSize) / 2;

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject()), "image/png");
    });
  }

  function makeQR(text) {
    return new Promise((resolve) => {
      const c = document.createElement("canvas");
      new QRious({ element: c, value: text, size: 256, backgroundAlpha: 0 });
      resolve(c.toDataURL("image/png"));
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

  function copyUrls() {
    const text = cards.map((c) => `${c.id}\t${c.url}`).join("\n");
    navigator.clipboard.writeText(text).then(
      () => showStatus("URLs copiadas al portapapeles.", "success"),
      () => showStatus("No se pudieron copiar las URLs.", "error")
    );
  }

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = `setup-status setup-status-${type}`;
    status.hidden = false;
  }
})();
