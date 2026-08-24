const sessions = new Map();
const TTL = 10 * 60 * 1000;
const MAX = 24_000;
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, no-cache, must-revalidate",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
const validToken = v => typeof v === "string" && /^[A-Za-z0-9_-]{20,80}$/.test(v);
const validClient = v => typeof v === "string" && /^[A-Za-z0-9_-]{12,80}$/.test(v);
const validSdp = v => typeof v === "string" && v.length > 20 && v.length <= 16000;

function cleanup() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.touched > TTL || now > session.exp) sessions.delete(token);
  }
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  cleanup();
  if ((Number(request.headers.get("content-length")) || 0) > MAX) return json({ ok: false, error: "request too large" }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }
  const token = body.token;
  if (!validToken(token)) return json({ ok: false, error: "invalid session" }, 400);

  const now = Date.now();
  let session = sessions.get(token);

  if (body.action === "offer") {
    if (!validClient(body.client) || !validSdp(body.offer)) return json({ ok: false, error: "invalid offer" }, 400);
    const exp = Math.min(Number(body.exp) || now + TTL, now + TTL);
    session = { offer: body.offer, owner: body.client, exp, touched: now, request: null };
    sessions.set(token, session);
    return json({ ok: true, expires: exp });
  }

  if (!session || now > session.exp) {
    sessions.delete(token);
    return json({ ok: false, error: "session expired" }, 410);
  }
  session.touched = now;

  if (!validClient(body.client)) return json({ ok: false, error: "invalid client" }, 400);

  switch (body.action) {
    case "request": {
      if (body.client === session.owner) return json({ ok: false, error: "owner cannot request itself" }, 400);
      if (!validSdp(body.answer)) return json({ ok: false, error: "invalid answer" }, 400);
      if (session.request && session.request.client !== body.client && session.request.status === "pending") {
        return json({ ok: false, error: "another request is pending" }, 409);
      }
      session.request = { client: body.client, answer: body.answer, status: "pending", touched: now };
      return json({ ok: true, status: "pending" });
    }
    case "poll": {
      const requestForOwner = body.client === session.owner;
      const r = session.request;
      if (!r) return json({ ok: true, request: null, answer: null });
      if (now - r.touched > TTL) {
        session.request = null;
        return json({ ok: true, request: null, answer: null });
      }
      if (requestForOwner) {
        return json({ ok: true, request: { client: r.client, status: r.status } });
      }
      if (r.client !== body.client) return json({ ok: true, request: null, answer: null });
      return json({ ok: true, request: { status: r.status }, approved: r.status === "approved", answer: r.status === "approved" ? r.answer : null });
    }
    case "approve": {
      if (body.client !== session.owner || !session.request) return json({ ok: false, error: "no pending request" }, 409);
      if (session.request.status !== "pending") return json({ ok: false, error: "request already closed" }, 409);
      session.request.status = "approved";
      session.request.touched = now;
      return json({ ok: true, status: "approved" });
    }
    case "reject": {
      if (body.client !== session.owner || !session.request) return json({ ok: false, error: "no pending request" }, 409);
      session.request.status = "rejected";
      session.request.touched = now;
      return json({ ok: true, status: "rejected" });
    }
    default:
      return json({ ok: false, error: "unsupported action" }, 400);
  }
}
