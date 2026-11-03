const crypto = require('crypto');

const COOKIE_NAME = 'rom_sess';
const MAX_AGE_SEC = 60 * 60 * 12; // 12h

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET não configurado');
  return secret;
}

function getUsers() {
  const raw = process.env.AUTH_USERS;
  if (!raw) throw new Error('AUTH_USERS não configurado');
  const users = JSON.parse(raw);
  if (!Array.isArray(users) || !users.length) throw new Error('AUTH_USERS inválido');
  return users;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function findUser(email, password) {
  const needle = normalizeEmail(email);
  const user = getUsers().find(u => normalizeEmail(u.email) === needle);
  if (!user) return null;
  const a = Buffer.from(String(user.password));
  const b = Buffer.from(String(password || ''));
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return {
    email: normalizeEmail(user.email),
    name: user.name,
    role: user.role,
    unit: user.unit,
  };
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function fromB64url(str) {
  return Buffer.from(String(str), 'base64url');
}

function signPayload(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || !payload.exp || Date.now() > payload.exp) return null;
  if (!payload.email || !payload.unit) return null;
  return {
    email: payload.email,
    name: payload.name,
    role: payload.role,
    unit: payload.unit,
  };
}

function makeSession(user) {
  return signPayload({
    email: user.email,
    name: user.name,
    role: user.role,
    unit: user.unit,
    exp: Date.now() + MAX_AGE_SEC * 1000,
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  String(header).split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function readSession(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME]);
}

function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

function allowCors(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

module.exports = {
  COOKIE_NAME,
  findUser,
  makeSession,
  readSession,
  sessionCookie,
  clearSessionCookie,
  sendJson,
  allowCors,
  readBody,
};
