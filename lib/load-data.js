const fs = require('fs');
const path = require('path');

function readJson(name) {
  const file = path.join(process.cwd(), 'api', '_data', name);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadAll() {
  return {
    meta: readJson('meta.json'),
    brasil: readJson('brasil.json'),
    iguatemi: readJson('iguatemi.json'),
    monthly: readJson('monthly.json'),
  };
}

function filterPayload(user) {
  const all = loadAll();
  const unit = user.unit;
  if (unit === 'ambas') {
    return {
      ...all.meta,
      user: { name: user.name, email: user.email, role: user.role, unit: user.unit },
      unidades: { brasil: all.brasil, iguatemi: all.iguatemi },
      monthly: { brasil: all.monthly.brasil, iguatemi: all.monthly.iguatemi },
    };
  }
  if (unit === 'brasil') {
    return {
      ...all.meta,
      user: { name: user.name, email: user.email, role: user.role, unit: user.unit },
      unidades: { brasil: all.brasil },
      monthly: { brasil: all.monthly.brasil },
    };
  }
  if (unit === 'iguatemi') {
    return {
      ...all.meta,
      user: { name: user.name, email: user.email, role: user.role, unit: user.unit },
      unidades: { iguatemi: all.iguatemi },
      monthly: { iguatemi: all.monthly.iguatemi },
    };
  }
  const err = new Error('Unidade inválida na sessão');
  err.statusCode = 403;
  throw err;
}

module.exports = { loadAll, filterPayload };
