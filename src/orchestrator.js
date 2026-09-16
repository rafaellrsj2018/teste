const processados = new Map();
const { observabilidade } = require('./observability');
const { agenteIa } = require('./ai');

function validarPedido(pedido) {
  if (!pedido || typeof pedido !== 'object' || !pedido.orderId) {
    throw new Error('Pedido inválido: orderId é obrigatório');
  }

  return { ...pedido, validado: true };
}

function processarPedido(pedido) {
  return { ...pedido, processado: true };
}

function notificarPedido(pedido) {
  return { ...pedido, notificado: true };
}

async function comRetry(acao, tentativas = 3, monitoramento = observabilidade, etapa) {
  let ultimoErro;

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      return await acao();
    } catch (error) {
      ultimoErro = error;
      if (tentativa < tentativas) {
        monitoramento.incrementar('tentativasRetry');
        monitoramento.registrar('retry_agendado', { etapa, tentativa, severity: 'WARNING' });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  throw ultimoErro;
}

async function orquestrarPedido({ messageId, pedido, etapas = {}, publicarNaDlq, observabilidade: monitoramento = observabilidade, ia = agenteIa } = {}) {
  const inicio = Date.now();
  monitoramento.registrar('orquestracao_iniciada', { messageId });
  if (!messageId) {
    throw new Error('messageId é obrigatório para idempotência');
  }

  if (processados.has(messageId)) {
    monitoramento.incrementar('mensagensDuplicadas');
    monitoramento.registrar('mensagem_duplicada', { messageId, severity: 'WARNING' });
    return { ...processados.get(messageId), duplicado: true };
  }

  const executar = {
    validar: etapas.validar || (() => validarPedido(pedido)),
    ia: etapas.ia || ((resultado) => ia.analisar(resultado)),
    processar: etapas.processar || ((resultado) => processarPedido(resultado)),
    notificar: etapas.notificar || ((resultado) => notificarPedido(resultado))
  };

  try {
    const validado = await comRetry(() => executar.validar(), 3, monitoramento, 'validar');
    const analisado = await comRetry(() => executar.ia(validado), 3, monitoramento, 'ia');
    const processado = await comRetry(() => executar.processar({ ...validado, analiseIa: analisado }), 3, monitoramento, 'processar');
    const resultado = await comRetry(() => executar.notificar(processado), 3, monitoramento, 'notificar');
    const resposta = { ok: true, status: 'success', messageId, resultado };
    processados.set(messageId, resposta);
    const duracaoMs = monitoramento.medir(inicio);
    monitoramento.registrar('orquestracao_concluida', { messageId, duracaoMs });
    return resposta;
  } catch (error) {
    monitoramento.incrementar('falhas');
    const falha = { ok: false, status: 'failed', messageId, error: error.message };
    monitoramento.registrar('orquestracao_falhou', { messageId, error: error.message, severity: 'ERROR' });
    if (publicarNaDlq) {
      await publicarNaDlq(falha);
    }
    return falha;
  }
}

function limparProcessados() {
  processados.clear();
}

module.exports = {
  validarPedido,
  processarPedido,
  notificarPedido,
  orquestrarPedido,
  limparProcessados
};
