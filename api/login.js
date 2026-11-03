const {
  findUser,
  makeSession,
  sessionCookie,
  sendJson,
  allowCors,
  readBody,
} = require('../lib/auth');

module.exports = async function handler(req, res) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método não permitido' });
  }

  try {
    const body = await readBody(req);
    const user = findUser(body.email, body.password);
    if (!user) {
      return sendJson(res, 401, { error: 'E-mail ou senha inválidos' });
    }
    const token = makeSession(user);
    return sendJson(res, 200, { user }, { 'Set-Cookie': sessionCookie(token) });
  } catch (err) {
    console.error('login error', err);
    return sendJson(res, 500, { error: 'Falha no login' });
  }
};
