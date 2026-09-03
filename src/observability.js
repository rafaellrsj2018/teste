function criarObservabilidade({ logger = console.log, agora = () => Date.now() } = {}) {
  const metricas = {
    mensagensRecebidas: 0,
    mensagensProcessadas: 0,
    mensagensDuplicadas: 0,
    falhas: 0,
    tentativasRetry: 0,
    duracaoTotalMs: 0
  };

  function registrar(evento, campos = {}) {
    logger(JSON.stringify({
      severity: campos.severity || 'INFO',
      message: evento,
      timestamp: new Date(agora()).toISOString(),
      ...campos
    }));
  }

  function incrementar(nome, valor = 1) {
    if (Object.prototype.hasOwnProperty.call(metricas, nome)) {
      metricas[nome] += valor;
    }
  }

  function medir(inicio) {
    const duracaoMs = Math.max(0, agora() - inicio);
    incrementar('duracaoTotalMs', duracaoMs);
    return duracaoMs;
  }

  return {
    registrar,
    incrementar,
    medir,
    metricas: () => ({ ...metricas }),
    limpar: () => Object.keys(metricas).forEach((nome) => { metricas[nome] = 0; })
  };
}

const observabilidade = criarObservabilidade();

module.exports = {
  criarObservabilidade,
  observabilidade
};
