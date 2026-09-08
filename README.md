# TarjetasNFC — Landing MVP

Landing page para validar interés en tarjetas NFC personalizadas (reseñas de Google, redes sociales, llamadas, WiFi, etc.).

## Stack

HTML + CSS + JS estáticos, sin dependencias. Deploy en Vercel.

## Cambiar datos de contacto

Edita el objeto `CONTACT` en `app.js` (número de WhatsApp, usuario de Telegram y email).

## Configurar Google Places

La clave pública de Google no va en el código versionado. Para local, puedes crear un `config.js` con este contenido:

```js
window.TARJETASNFC_CONFIG = {
  googlePlacesApiKey: "TU_CLAVE_PUBLICA_RESTRINGIDA"
};
```

Pasos mínimos:

1. Rota o revoca en Google Cloud la clave que estuvo en commits anteriores.
2. Crea una clave pública de navegador para este sitio.
3. Habilita Maps JavaScript API y Places API.
4. Restringe la clave por HTTP referrer al dominio de producción.
5. En Vercel, configura la variable de entorno `GOOGLE_PLACES_API_KEY`. El build genera `/config.js` sin commitear la clave.

## QR de reseñas

Cuando se genera un enlace de reseña, el sitio pide el QR a `quickchart.io` sin instalar dependencias. Solo se envía el enlace público de reseña de Google como texto codificado; no se envían claves ni datos internos.

## Contenido

- `index.html` — landing completa
- `legal.html` / `privacidad.html` — páginas legales
- `assets/` — vídeo demostrativo (`demo.mp4`), imagen del producto (`producto.png`), poster del vídeo
