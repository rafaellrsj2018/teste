const http = require('http');
const { handler } = require('./handler');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const method = req.method || 'GET';
  const bodyChunks = [];

  req.on('data', (chunk) => bodyChunks.push(chunk));
  req.on('end', () => {
    let body = {};

    try {
      const raw = Buffer.concat(bodyChunks).toString();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }

    const request = {
      method,
      url: url.pathname + url.search,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
    };

    const response = {
      statusCode: 200,
      headers: {},
      body: '',
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      },
      json(payload) {
        this.body = JSON.stringify(payload);
        res.writeHead(this.statusCode, this.headers);
        res.end(this.body);
        return this;
      },
      send(payload) {
        this.body = payload;
        res.writeHead(this.statusCode, this.headers);
        res.end(this.body);
        return this;
      },
    };

    handler(request, response);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Local server running at http://localhost:${PORT}`);
});
