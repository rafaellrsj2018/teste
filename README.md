# Checkpoint 3 - Orquestração de pedidos

Pipeline serverless de processamento de pedidos com Google Cloud Workflows. O fluxo valida, processa e notifica o pedido em sequência, com retry, idempotência por `messageId` e encaminhamento de falhas para uma Dead-Letter Queue (DLQ).

## Provedor utilizado

* Google Cloud Platform (GCP)
* Google Cloud Workflows
* Google Cloud Pub/Sub

## Como rodar localmente

### Pré-requisitos

* Node.js versão 18 ou superior
* Terminal de comandos aberto na raiz do projeto

### Passo a passo

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Execute os testes:
   ```bash
   npm test
   ```
3. Inicie o servidor local da função Pub/Sub:
   ```bash
   npm start
   ```

O orquestrador pode ser executado em código Node.js importando `orquestrarPedido` de `src/orchestrator.js`. Ele aceita `messageId`, o objeto `pedido` e funções opcionais para substituir as etapas durante testes.

## Workflow

A definição está em `workflows/pedido.yaml`. Antes de implantar, configure estas variáveis de ambiente do Workflow:

* `VALIDAR_URL`
* `PROCESSAR_URL`
* `NOTIFICAR_URL`
* `DLQ_TOPIC`

As três chamadas HTTP usam até três tentativas com backoff exponencial. Falhas na notificação são publicadas no tópico DLQ. As funções devem tratar `messageId` como chave de idempotência; o exemplo local implementa essa proteção em memória.

Exemplo de implantação:

```bash
gcloud workflows deploy pedido-orquestracao --source=workflows/pedido.yaml --location=us-central1
```

Configure autenticação das chamadas e permissões do Pub/Sub diretamente no GCP, usando Secret Manager ou Workload Identity quando necessário. Não coloque chaves, credenciais, arquivos `.json` ou URLs de funções ativas neste repositório.

## Entrega segura

Envie o link deste repositório público no campo de URL do Canvas. Envie a URL privada da função ativa somente nos comentários ou na caixa de texto da entrega.
