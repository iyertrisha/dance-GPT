/**
 * Build URLs to the DanceGPT FastAPI app.
 *
 * Use AI_SERVICE_URL=http://127.0.0.1:8000 (not localhost) when another Docker
 * container also publishes port 8000 — on macOS, localhost often hits Docker via IPv6.
 */
const DEFAULT_AI_BASE = "http://127.0.0.1:8000";

function getAiBaseUrl() {
  const raw = String(process.env.AI_SERVICE_URL || DEFAULT_AI_BASE).trim();
  if (!raw) {
    return DEFAULT_AI_BASE;
  }
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    // localhost:8000 may reach a different service than 127.0.0.1:8000 (Docker vs uvicorn).
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
    }
    let path = u.pathname.replace(/\/+$/, "");
    if (path === "/ai") {
      path = "";
    }
    const baseNoSlash = `${u.origin}${path}`.replace(/\/+$/, "");
    return baseNoSlash.length ? baseNoSlash : u.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

/**
 * @param {string} path - begins with '/', e.g. '/ai/chat'
 */
function aiServiceUrl(path) {
  const base = getAiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

module.exports = { getAiBaseUrl, aiServiceUrl };
