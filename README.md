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
  googlePlacesApiKey: "TU_CLAVE_PUBLICA_RESTRINGIDA",
  supabaseUrl: "TU_SUPABASE_URL",
  supabaseAnonKey: "TU_SUPABASE_ANON_KEY"
};
```

Pasos mínimos:

1. Rota o revoca en Google Cloud la clave que estuvo en commits anteriores.
2. Crea una clave pública de navegador para este sitio.
3. Habilita Maps JavaScript API y Places API.
4. Restringe la clave por HTTP referrer al dominio de producción.
5. En Vercel, configura la variable de entorno `GOOGLE_PLACES_API_KEY`. El build genera `/config.js` sin commitear la clave.

## QR redirigible con Supabase

Los QR físicos pueden apuntar a `/r/ID_DE_TARJETA`. Vercel reescribe esa ruta a `/api/redirect`, que consulta Supabase con una clave server-only y redirige al `redirect_url` configurado. Si la tarjeta no existe o no tiene destino, manda a `/setup.html?card=ID_DE_TARJETA`.

Variables de entorno necesarias en Vercel:

- `SUPABASE_URL` — URL pública del proyecto Supabase.
- `SUPABASE_ANON_KEY` — clave anon pública para `/setup.html`.
- `SUPABASE_SERVICE_ROLE_KEY` — clave server-only para la función de redirección. No se expone en `config.js`.
- `GOOGLE_PLACES_API_KEY` — opcional para el generador de reseñas.

Aplica `supabase.sql` en Supabase para crear la tabla `cards`, checks, índice, trigger de `updated_at` y políticas RLS. La configuración pública permite a usuarios autenticados crear/reclamar tarjetas libres con su `owner_id` y gestionar sólo sus propias tarjetas. La consulta pública de redirección queda server-side en Vercel.

## QR de reseñas

Cuando se genera un enlace de reseña, el sitio pide el QR a `quickchart.io` sin instalar dependencias. Solo se envía el enlace público de reseña de Google como texto codificado; no se envían claves ni datos internos.

## Contenido

- `index.html` — landing completa
- `legal.html` / `privacidad.html` — páginas legales
- `assets/` — vídeo demostrativo (`demo.mp4`), imagen del producto (`producto.png`), poster del vídeo
