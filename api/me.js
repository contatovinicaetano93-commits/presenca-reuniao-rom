const { readSession, sendJson, allowCors } = require('../lib/auth');

module.exports = async function handler(req, res) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Método não permitido' });
  }
  const user = readSession(req);
  if (!user) return sendJson(res, 401, { error: 'Não autenticado' });
  return sendJson(res, 200, { user });
};
