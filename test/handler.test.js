const test = require('node:test');
const assert = require('node:assert/strict');
const { handler, decodeMessage } = require('../src/handler.js');
const { limparProcessados, orquestrarPedido } = require('../src/orchestrator.js');
const { criarObservabilidade } = require('../src/observability.js');
const { classificacaoLocal } = require('../src/ai.js');

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

test('orquestra o pedido e retorna o mesmo resultado para mensagem duplicada', async () => {
  limparProcessados();
  const entrada = { messageId: 'orquestracao-1', pedido: { orderId: 'pedido-3' } };

  const primeiro = await orquestrarPedido(entrada);
  const duplicado = await orquestrarPedido(entrada);

  assert.equal(primeiro.ok, true);
  assert.equal(primeiro.resultado.notificado, true);
  assert.equal(duplicado.duplicado, true);
  assert.deepEqual(duplicado.resultado, primeiro.resultado);
});

test('repete uma etapa com falha transitória', async () => {
  limparProcessados();
  let tentativas = 0;

  const resultado = await orquestrarPedido({
    messageId: 'retry-1',
    pedido: { orderId: 'pedido-4' },
    etapas: {
      processar: (pedido) => {
        tentativas += 1;
        if (tentativas < 2) throw new Error('falha transitória');
        return { ...pedido, processado: true };
      }
    }
  });

  assert.equal(resultado.ok, true);
  assert.equal(tentativas, 2);
});

test('analisa o pedido com IA antes do processamento', async () => {
  limparProcessados();
  const resultado = await orquestrarPedido({
    messageId: 'ia-1',
    pedido: { orderId: 'pedido-ia', total: 700 },
    ia: { analisar: async (pedido) => classificacaoLocal(pedido) }
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.resultado.analiseIa.categoria, 'alto_valor');
  assert.equal(resultado.resultado.analiseIa.recomendacao, 'revisao_manual');
  assert.equal(resultado.resultado.analiseIa.provedor, 'local');
});

test('envia falha definitiva para a DLQ', async () => {
  limparProcessados();
  let mensagemDlq;

  const resultado = await orquestrarPedido({
    messageId: 'dlq-1',
    pedido: { orderId: 'pedido-5' },
    etapas: { notificar: () => { throw new Error('serviço indisponível'); } },
    publicarNaDlq: async (mensagem) => { mensagemDlq = mensagem; }
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.status, 'failed');
  assert.deepEqual(mensagemDlq, resultado);
});

test('registra logs estruturados e métricas do pipeline', async () => {
  limparProcessados();
  const registros = [];
  const monitoramento = criarObservabilidade({ logger: (linha) => registros.push(JSON.parse(linha)) });

  handler(eventoPubSub(JSON.stringify({ orderId: 'pedido-6' })), { observabilidade: monitoramento });
  await orquestrarPedido({
    messageId: 'observabilidade-1',
    pedido: { orderId: 'pedido-6' },
    observabilidade: monitoramento
  });
  await orquestrarPedido({
    messageId: 'observabilidade-1',
    pedido: { orderId: 'pedido-6' },
    observabilidade: monitoramento
  });

  const metricas = monitoramento.metricas();
  assert.equal(metricas.mensagensRecebidas, 1);
  assert.equal(metricas.mensagensProcessadas, 1);
  assert.equal(metricas.mensagensDuplicadas, 1);
  assert.ok(metricas.duracaoTotalMs >= 0);
  assert.ok(registros.some((registro) => registro.message === 'mensagem_processada'));
  assert.ok(registros.some((registro) => registro.message === 'mensagem_duplicada'));
});
