import { writeFileSync } from "node:fs";

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

writeFileSync(
  "config.js",
  `window.TARJETASNFC_CONFIG = ${JSON.stringify({ googlePlacesApiKey, supabaseUrl, supabaseAnonKey })};\n`
);
