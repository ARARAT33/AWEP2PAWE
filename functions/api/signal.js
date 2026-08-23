const memory = new Map();
const TTL = 60_000;
const MAX = 20_000;

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function clean() {
  const now = Date.now();
  for (const [key, value] of memory) {
    if (now - value.at > TTL) memory.delete(key);
  }
}

function validToken(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,40}$/.test(value);
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  clean();
  if ((Number(request.headers.get("content-length")) || 0) > MAX) {
    return json({ ok: false, error: "too large" }, 413);
  }

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }

  const token = body.token;
  if (!validToken(token)) return json({ ok: false, error: "invalid session" }, 400);

  let peer = memory.get(token);
  if (!peer) {
    peer = { at: Date.now(), call: [] };
    memory.set(token, peer);
  }
  peer.at = Date.now();

  switch (body.action) {
    case "offer":
      if (typeof body.offer !== "string" || body.offer.length > 12000) return json({ ok: false, error: "invalid offer" }, 400);
      peer.offer = body.offer;
      peer.pub = body.pub;
      peer.name = String(body.name || "Peer").slice(0, 80);
      return json({ ok: true, expires: TTL });
    case "get":
      return json({ ok: true, offer: peer.offer || null, name: peer.name || "Peer" });
    case "answer":
      if (typeof body.answer !== "string" || body.answer.length > 12000) return json({ ok: false, error: "invalid answer" }, 400);
      peer.answer = body.answer;
      peer.answerPub = body.pub;
      return json({ ok: true });
    case "poll":
      return json({ ok: true, answer: peer.answer || null });
    case "call":
      if (typeof body.data !== "string" || body.data.length > 12000) return json({ ok: false, error: "invalid call" }, 400);
      peer.call.push(body.data);
      peer.call = peer.call.slice(-2);
      return json({ ok: true });
    case "callpoll":
      return json({ ok: true, data: peer.call.shift() || null });
    default:
      return json({ ok: false, error: "unsupported action" }, 400);
  }
}
