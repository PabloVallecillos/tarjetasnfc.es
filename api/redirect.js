const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(request, response) {
  const cardId = String(request.query.card || "").trim();

  if (!isCardId(cardId) || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    redirectToSetup(response, isCardId(cardId) ? cardId : "");
    return;
  }

  try {
    const url = new URL("/rest/v1/cards", SUPABASE_URL);
    url.searchParams.set("card_id", `eq.${cardId}`);
    url.searchParams.set("select", "redirect_url");
    url.searchParams.set("limit", "1");

    const supabaseResponse = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!supabaseResponse.ok) {
      redirectToSetup(response, cardId);
      return;
    }

    const [card] = await supabaseResponse.json();
    const target = card?.redirect_url;

    if (!isHttpUrl(target)) {
      redirectToSetup(response, cardId);
      return;
    }

    response.writeHead(302, { Location: target, "Cache-Control": "no-store" });
    response.end();
  } catch {
    redirectToSetup(response, cardId);
  }
};

function redirectToSetup(response, cardId) {
  const location = `/setup.html${cardId ? `?card=${encodeURIComponent(cardId)}` : ""}`;
  response.writeHead(302, { Location: location, "Cache-Control": "no-store" });
  response.end();
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isCardId(value) {
  return /^[A-Za-z0-9_-]{3,64}$/.test(value);
}
