import { writeFileSync } from "node:fs";

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || "";

writeFileSync(
  "config.js",
  `window.TARJETASNFC_CONFIG = ${JSON.stringify({ googlePlacesApiKey })};\n`
);
