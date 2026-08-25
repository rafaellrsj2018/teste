const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../src/handler.js');

test('GET / returns a success payload with status 200', () => {
  const req = {
    method: 'GET',
    url: '/?name=Aluno',
    headers: { accept: 'application/json' },
    query: { name: 'Aluno' },
    body: undefined
  };

  const res = {
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
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    }
  };

  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /Aluno/);
  assert.match(res.body, /success|hello/i);
});

test('POST / echoes the received message', () => {
  const req = {
    method: 'POST',
    url: '/echo',
    headers: { 'content-type': 'application/json' },
    query: {},
    body: { message: 'checkpoint' }
  };

  const res = {
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
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    }
  };

  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /checkpoint/);
});
