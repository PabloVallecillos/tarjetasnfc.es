const form = document.querySelector("#gen-form");
const output = document.querySelector("#cards-output");
const tpl = document.querySelector("#card-tpl");
const actions = document.querySelector("#gen-actions");
const status = document.querySelector("#gen-status");
const btnPrint = document.querySelector("#btn-print");
const btnList = document.querySelector("#btn-list");

function randomId(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const count = Math.min(20, Math.max(1, parseInt(document.querySelector("#count").value, 10) || 10));
  const domain = document.querySelector("#domain").value.trim().replace(/\/+$/, "");

  output.innerHTML = "";
  const ids = [];

  for (let i = 0; i < count; i++) {
    const cardId = randomId();
    ids.push(cardId);
    const url = `https://${domain}/r/${cardId}`;

    const card = tpl.content.cloneNode(true);
    const canvas = card.querySelector(".gen-qr-canvas");

    QRCode.toCanvas(canvas, url, {
      width: 120,
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
    });

    output.appendChild(card);
  }

  actions.hidden = false;
  status.hidden = false;
  status.textContent = `${count} tarjetas generadas. Cada QR apunta a ${domain}/r/{id}`;
  status.className = "setup-status setup-status-success";
  status.dataset.ids = ids.join("\n");
});

btnPrint.addEventListener("click", () => {
  window.print();
});

btnList.addEventListener("click", () => {
  const domain = document.querySelector("#domain").value.trim().replace(/\/+$/, "");
  const ids = (status.dataset.ids || "").split("\n").filter(Boolean);
  const lines = ids.map((id) => `https://${domain}/r/${id}`);
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    status.textContent = `${ids.length} URLs copiadas al portapapeles`;
    status.className = "setup-status setup-status-success";
  });
});
