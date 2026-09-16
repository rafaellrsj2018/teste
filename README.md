# Checkpoint 5 - CI/CD do pipeline

Pipeline de pedidos instrumentado com logging estruturado e métricas, publicado automaticamente no Render por GitHub Actions.

## Provedor utilizado

* Render
* GitHub Actions
* Node.js
* Logs estruturados em JSON

## Como rodar localmente

### Pré-requisitos

* Node.js versão 18 ou superior
* Terminal aberto na raiz do projeto

```bash
npm install
npm test
npm start
```

Os logs locais são linhas JSON no stdout. Cada registro inclui `severity`, `message`, `timestamp` e `messageId`, sem registrar o conteúdo do pedido ou credenciais. O módulo `src/observability.js` também mantém contadores para testes e desenvolvimento local.

## Sinais instrumentados

* `mensagensRecebidas`: eventos Pub/Sub recebidos.
* `mensagensProcessadas`: eventos aceitos e processados.
* `mensagensDuplicadas`: eventos ignorados pela idempotência.
* `tentativasRetry`: novas tentativas após falha transitória.
* `falhas`: entradas inválidas ou execuções definitivas com erro.
* `duracaoTotalMs`: duração acumulada das operações instrumentadas.

O orquestrador registra `orquestracao_iniciada`, `retry_agendado`, `mensagem_duplicada`, `orquestracao_concluida` e `orquestracao_falhou`.

## Evidências

Execute `npm test` e capture o terminal com os 8 testes aprovados e as linhas JSON emitidas. No Render, confirme o serviço ativo e os logs da aplicação. Os testes automatizados em `test/handler.test.js` comprovam processamento, duplicidade, retry, DLQ, logs e contadores.

Não há prints ou URLs privadas versionados neste repositório. As capturas devem ser adicionadas à entrega do Canvas, após remover dados sensíveis.

## Análise e otimizações propostas

1. **Persistir idempotência fora da memória:** trocar o `Map` local por Firestore ou Memorystore com TTL. Isso evita reprocessamento quando a função escala horizontalmente ou reinicia, aumentando a confiabilidade; o TTL limita custo e crescimento do armazenamento.
2. **Reduzir cardinalidade dos logs:** manter `messageId` para correlação, mas evitar incluir payloads e atributos de alta cardinalidade. Isso reduz volume de Logging e custo de armazenamento sem perder capacidade de diagnóstico.
3. **Separar retry de falhas permanentes:** classificar respostas HTTP 4xx como não retryáveis e reservar as três tentativas para 5xx/timeouts. Isso diminui latência e chamadas inúteis, reduzindo custo e acelerando o envio de mensagens inválidas para a DLQ.

## CI/CD e segurança

O arquivo `.github/workflows/deploy.yml` executa `npm ci` e `npm test` antes de acionar o deploy do serviço no Render. Ele é executado em alterações na branch `main` que afetem o código ou a configuração do serviço e também pode ser iniciado manualmente pela aba **Actions** do GitHub. A definição do serviço está em `render.yaml`.

### Configuração dos secrets

No repositório GitHub, crie o environment `production` e configure o seguinte **Secret**:

* `RENDER_DEPLOY_HOOK`: URL privada do Deploy Hook criado nas configurações do serviço Render.

O Deploy Hook deve ser mantido somente nos Secrets do GitHub. O pipeline não utiliza usuário, senha ou chave JSON.

### Evidência do deploy

Após a primeira execução bem-sucedida, abra **Actions > Deploy no Render**, selecione o job concluído e copie o link ou o log para a entrega no Canvas. A execução deve mostrar as etapas **Instalar dependências**, **Executar testes** e **Publicar serviço no Render** com sucesso. No painel do Render, confirme também que o deploy foi concluído. Não versionar prints com tokens, URLs privadas ou outros dados sensíveis.

O serviço Render executa a API Node definida em `src/local.js`, usando a porta fornecida pela variável `PORT`.

Nunca versione tokens, arquivos `.json`, `.env`, URLs privadas ou links de dashboards privados.
