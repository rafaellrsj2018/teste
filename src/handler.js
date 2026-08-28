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

function handler(event = {}) {
  const data = decodeMessage(event);
  const message = (event.data && event.data.message) || event.message;

  return {
    ok: true,
    status: 'success',
    message: 'Evento Pub/Sub processado com sucesso',
    data,
    messageId: message.messageId || null,
    attributes: message.attributes || {}
  };
}

module.exports = {
  handler,
  decodeMessage
};
