# Checkpoint 4 - Observabilidade do pipeline

Pipeline serverless de pedidos instrumentado com logging estruturado e métricas. A solução usa Google Cloud Logging/Monitoring, mantendo a idempotência, os retries e a DLQ do Checkpoint 3.

## Provedor utilizado

* Google Cloud Platform (GCP)
* Google Cloud Workflows
* Google Cloud Pub/Sub
* Google Cloud Logging e Monitoring

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

O orquestrador registra `orquestracao_iniciada`, `retry_agendado`, `mensagem_duplicada`, `orquestracao_concluida` e `orquestracao_falhou`. O Workflow registra também o início e as etapas usando `sys.log`; esses registros aparecem no Cloud Logging quando o logging do Workflow está habilitado.

## Evidências

Execute `npm test` e capture o terminal com os testes aprovados e as linhas JSON emitidas. No GCP, abra **Logging > Logs Explorer**, filtre pelos eventos `orquestracao_concluida` e `orquestracao_falhou`, e abra **Monitoring > Metrics** para visualizar as métricas derivadas dos logs. Os testes automatizados em `test/handler.test.js` comprovam processamento, duplicidade, retry, DLQ, logs e contadores.

Para criar métricas baseadas nos logs, use o console do Cloud Logging com filtros como:

```text
jsonPayload.message="orquestracao_concluida"
jsonPayload.message="orquestracao_falhou"
```

Ou crie contadores no projeto GCP pelo terminal:

```bash
gcloud logging metrics create pedidos_processados --log-filter='jsonPayload.message="orquestracao_concluida"'
gcloud logging metrics create pedidos_falhos --log-filter='jsonPayload.message="orquestracao_falhou"'
```

Não há prints ou URLs ativos versionados neste repositório. As capturas devem ser adicionadas à entrega do Canvas, após remover dados sensíveis.

## Análise e otimizações propostas

1. **Persistir idempotência fora da memória:** trocar o `Map` local por Firestore ou Memorystore com TTL. Isso evita reprocessamento quando a função escala horizontalmente ou reinicia, aumentando a confiabilidade; o TTL limita custo e crescimento do armazenamento.
2. **Reduzir cardinalidade dos logs:** manter `messageId` para correlação, mas evitar incluir payloads e atributos de alta cardinalidade. Isso reduz volume de Logging e custo de armazenamento sem perder capacidade de diagnóstico.
3. **Separar retry de falhas permanentes:** classificar respostas HTTP 4xx como não retryáveis e reservar as três tentativas para 5xx/timeouts. Isso diminui latência e chamadas inúteis, reduzindo custo e acelerando o envio de mensagens inválidas para a DLQ.

## CI/CD e segurança

O arquivo `.github/workflows/deploy.yml` executa `npm ci` e `npm test` antes de publicar o Workflow no Google Cloud. Ele é executado em alterações na branch `main` que afetem o código ou a definição do Workflow e também pode ser iniciado manualmente pela aba **Actions** do GitHub.

### Configuração dos secrets

No repositório GitHub, crie o environment `production` e configure os seguintes valores. Todos, exceto `GCP_REGION`, devem ser cadastrados como **Secrets**; `GCP_REGION` pode ser uma variável comum do environment.

* `GCP_WORKLOAD_IDENTITY_PROVIDER`: recurso do provedor OIDC configurado no Google Cloud.
* `GCP_SERVICE_ACCOUNT`: conta de serviço usada pelo deploy.
* `GCP_PROJECT_ID`: ID do projeto GCP.
* `VALIDAR_URL`: URL da função de validação.
* `PROCESSAR_URL`: URL da função de processamento.
* `NOTIFICAR_URL`: URL da função de notificação.
* `DLQ_TOPIC`: nome completo do tópico Pub/Sub da DLQ.
* `GCP_REGION`: região do Workflow, por exemplo `us-central1`.

A conta de serviço precisa ter permissão para publicar versões do Workflows e para usar as APIs chamadas pelo Workflow. O provedor OIDC deve limitar o acesso ao repositório e à branch `main`. O pipeline não usa chaves JSON: a autenticação ocorre por credenciais temporárias via Workload Identity Federation.

### Evidência do deploy

Após a primeira execução bem-sucedida, abra **Actions > Deploy do Workflow**, selecione o job concluído e copie o link ou o log para a entrega no Canvas. A execução deve mostrar as etapas **Instalar dependências**, **Executar testes**, **Autenticar no Google Cloud** e **Publicar Workflow** com sucesso. Não versionar prints com tokens, URLs privadas ou outros dados sensíveis.

O comando equivalente para uma publicação manual, usando credenciais já configuradas localmente, é:

```bash
gcloud workflows deploy pedido-orquestracao --source=workflows/pedido.yaml --location=us-central1 --call-log-level=log-all-calls
```

A definição está em `workflows/pedido.yaml`. Configure no GCP as variáveis `VALIDAR_URL`, `PROCESSAR_URL`, `NOTIFICAR_URL` e `DLQ_TOPIC`, além das permissões das chamadas e do Pub/Sub.

Use Secret Manager ou Workload Identity para credenciais. Nunca versione chaves, arquivos `.json`, `.env`, URLs de funções ativas ou links de dashboards privados.
