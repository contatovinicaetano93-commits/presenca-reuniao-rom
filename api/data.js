const { readSession, sendJson, allowCors } = require('../lib/auth');
const { filterPayload } = require('../lib/load-data');

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

  try {
    const payload = filterPayload(user);
    return sendJson(res, 200, payload);
  } catch (err) {
    console.error('data error', err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: status === 403 ? err.message : 'Falha ao carregar dados' });
  }
};
