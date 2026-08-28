const test = require('node:test');
const assert = require('node:assert/strict');
const { handler, decodeMessage } = require('../src/handler.js');

function eventoPubSub(data, extras = {}) {
  return {
    message: {
      data: Buffer.from(data).toString('base64'),
      messageId: 'mensagem-123',
      attributes: { origem: 'teste' },
      ...extras
    },
    subscription: 'projects/projeto/subscriptions/orders-sub'
  };
}

test('processa uma mensagem JSON do Pub/Sub', () => {
  const result = handler(eventoPubSub(JSON.stringify({ orderId: 'pedido-1', total: 99.9 })));

  assert.equal(result.ok, true);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.data, { orderId: 'pedido-1', total: 99.9 });
  assert.equal(result.messageId, 'mensagem-123');
  assert.deepEqual(result.attributes, { origem: 'teste' });
});

test('aceita o formato CloudEvent do Cloud Functions', () => {
  const mensagem = eventoPubSub(JSON.stringify({ orderId: 'pedido-2' })).message;
  const result = handler({ data: { message: mensagem } });

  assert.deepEqual(result.data, { orderId: 'pedido-2' });
  assert.equal(result.messageId, 'mensagem-123');
});

test('processa texto quando a mensagem não contém JSON', () => {
  assert.equal(decodeMessage(eventoPubSub('pedido recebido')), 'pedido recebido');
});

test('rejeita evento sem dados Pub/Sub', () => {
  assert.throws(() => handler({ message: {} }), /message\.data é obrigatório/);
});
