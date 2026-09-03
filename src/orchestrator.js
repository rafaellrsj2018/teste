const processados = new Map();

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

async function comRetry(acao, tentativas = 3) {
  let ultimoErro;

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      return await acao();
    } catch (error) {
      ultimoErro = error;
      if (tentativa < tentativas) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  throw ultimoErro;
}

async function orquestrarPedido({ messageId, pedido, etapas = {}, publicarNaDlq } = {}) {
  if (!messageId) {
    throw new Error('messageId é obrigatório para idempotência');
  }

  if (processados.has(messageId)) {
    return { ...processados.get(messageId), duplicado: true };
  }

  const executar = {
    validar: etapas.validar || (() => validarPedido(pedido)),
    processar: etapas.processar || ((resultado) => processarPedido(resultado)),
    notificar: etapas.notificar || ((resultado) => notificarPedido(resultado))
  };

  try {
    const validado = await comRetry(() => executar.validar(), 3);
    const processado = await comRetry(() => executar.processar(validado), 3);
    const resultado = await comRetry(() => executar.notificar(processado), 3);
    const resposta = { ok: true, status: 'success', messageId, resultado };
    processados.set(messageId, resposta);
    return resposta;
  } catch (error) {
    const falha = { ok: false, status: 'failed', messageId, error: error.message };
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
