const { clearSessionCookie, sendJson, allowCors } = require('../lib/auth');

module.exports = async function handler(req, res) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método não permitido' });
  }
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
};
