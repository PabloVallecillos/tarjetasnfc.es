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

document.addEventListener("DOMContentLoaded", () => {
  // Rellenar enlaces de contacto
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappText)}`;
  const tg = `https://t.me/${CONTACT.telegram}`;
  const mail = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}`;

  document.querySelectorAll('[data-contact="whatsapp"]').forEach((a) => (a.href = wa));
  document.querySelectorAll('[data-contact="telegram"]').forEach((a) => (a.href = tg));
  document.querySelectorAll('[data-contact="email"]').forEach((a) => (a.href = mail));

  // Año en el footer
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

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
});