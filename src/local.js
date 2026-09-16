const http = require('http');
const { handler } = require('./handler');
const { orquestrarPedido } = require('./orchestrator');

const server = http.createServer((req, res) => {
  const bodyChunks = [];

  req.on('data', (chunk) => bodyChunks.push(chunk));
  req.on('end', async () => {
    let event = {};

    try {
      const raw = Buffer.concat(bodyChunks).toString();
      event = raw ? JSON.parse(raw) : {};
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'O corpo deve ser um JSON válido' }));
      return;
    }

    try {
      const recebido = handler(event);
      const result = req.url === '/pedidos'
        ? await orquestrarPedido({ messageId: recebido.messageId, pedido: recebido.data })
        : recebido;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: error.message }));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor local de teste Pub/Sub em http://localhost:${PORT}`);
});
