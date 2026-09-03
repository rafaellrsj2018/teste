const { observabilidade } = require('./observability');

function decodeMessage(event) {
  const message = (event && event.data && event.data.message) || (event && event.message);
  if (!message || typeof message.data !== 'string') {
    throw new Error('Evento Pub/Sub inválido: message.data é obrigatório');
  }

  const content = Buffer.from(message.data, 'base64').toString('utf8');
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function handler(event = {}, opcoes = {}) {
  const monitoramento = opcoes.observabilidade || observabilidade;
  const inicio = Date.now();
  monitoramento.incrementar('mensagensRecebidas');
  let data;
  let message;

  try {
    data = decodeMessage(event);
    message = (event.data && event.data.message) || event.message;
  } catch (error) {
    monitoramento.incrementar('falhas');
    monitoramento.registrar('mensagem_rejeitada', { error: error.message, severity: 'ERROR' });
    throw error;
  }
  const messageId = message.messageId || null;

  monitoramento.registrar('mensagem_recebida', {
    messageId,
    tipo: 'pubsub'
  });
  monitoramento.incrementar('mensagensProcessadas');
  const duracaoMs = monitoramento.medir(inicio);
  monitoramento.registrar('mensagem_processada', { messageId, duracaoMs });

  return {
    ok: true,
    status: 'success',
    message: 'Evento Pub/Sub processado com sucesso',
    data,
    messageId,
    attributes: message.attributes || {}
  };
}

module.exports = {
  handler,
  decodeMessage
};
