function classificacaoLocal(pedido) {
  const total = Number(pedido.total || 0);
  return {
    categoria: total >= 500 ? 'alto_valor' : 'padrao',
    prioridade: total >= 500 ? 'alta' : 'normal',
    recomendacao: total >= 500 ? 'revisao_manual' : 'processar_automaticamente',
    provedor: 'local'
  };
}

function extrairJson(conteudo) {
  const texto = String(conteudo).trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(texto);
}

async function analisarComModelo(pedido, configuracao) {
  const resposta = await fetch(configuracao.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${configuracao.chave}`
    },
    body: JSON.stringify({
      model: configuracao.modelo,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Classifique pedidos. Responda somente JSON com categoria, prioridade e recomendacao.'
        },
        { role: 'user', content: JSON.stringify(pedido) }
      ]
    })
  });

  if (!resposta.ok) {
    throw new Error(`Falha no serviço de IA: HTTP ${resposta.status}`);
  }

  const corpo = await resposta.json();
  const conteudo = corpo.choices && corpo.choices[0] && corpo.choices[0].message && corpo.choices[0].message.content;
  if (!conteudo) {
    throw new Error('Resposta de IA sem conteúdo');
  }

  return { ...extrairJson(conteudo), provedor: 'modelo_externo' };
}

function criarAgenteIa({ url = process.env.AI_API_URL, chave = process.env.AI_API_KEY, modelo = process.env.AI_MODEL || 'modelo-padrao' } = {}) {
  return {
    async analisar(pedido) {
      if (url && chave) {
        return analisarComModelo(pedido, { url, chave, modelo });
      }

      return classificacaoLocal(pedido);
    }
  };
}

const agenteIa = criarAgenteIa();

module.exports = {
  criarAgenteIa,
  agenteIa,
  classificacaoLocal
};