function handler(req, res) {
  const method = (req && req.method ? req.method : 'GET').toUpperCase();
  const query = (req && req.query) || {};
  const body = (req && req.body) || {};
  const name = query.name || body.name || 'mundo';

  if (method === 'GET') {
    return res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .json({
        ok: true,
        message: `Olá, ${name}!`,
        method,
        path: req && req.url ? req.url : '/',
        provider: 'AWS Lambda',
        status: 'success'
      });
  }

  if (method === 'POST') {
    const message = body.message || 'Sem mensagem recebida';
    return res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .json({
        ok: true,
        message: `Mensagem recebida: ${message}`,
        echo: message,
        method,
        status: 'success'
      });
  }

  return res
    .status(405)
    .setHeader('Content-Type', 'application/json')
    .json({
      ok: false,
      message: 'Método não permitido',
      method,
      status: 'error'
    });
}

module.exports = {
  handler,
  helloHttp: handler
};
