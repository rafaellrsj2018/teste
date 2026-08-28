# Checkpoint 2 - Processamento de pedidos com Pub/Sub

Este projeto contém uma função serverless orientada a eventos. Ela é acionada por mensagens publicadas em um tópico privado do Google Cloud Pub/Sub, como `orders`, e decodifica o conteúdo recebido.

## Provedor utilizado

* Google Cloud Platform (GCP)
* Google Cloud Pub/Sub

## Como rodar localmente

### Pré-requisitos

* Node.js instalado (versão 18 ou superior)
* Terminal de comandos aberto

### Passo a passo

1. Clone o repositório e entre na pasta do projeto.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute os testes:
   ```bash
   npm test
   ```
4. Inicie o servidor local de simulação:
   ```bash
   npm start
   ```
5. Em outro terminal, envie um envelope Pub/Sub de teste:
   ```bash
   node -e "const data = Buffer.from(JSON.stringify({orderId:'pedido-1'})).toString('base64'); fetch('http://localhost:3000', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({message:{data, messageId:'local-1'}})}).then(r=>r.text()).then(console.log)"
   ```

## Implantação

No GCP, crie uma função com trigger do Pub/Sub apontando para o tópico escolhido e configure o entry point como `handler`. O código aceita o CloudEvent padrão, no qual a mensagem fica em `event.data.message`. As credenciais devem ser fornecidas pela configuração segura do ambiente, nunca commitadas no repositório.

## Entrega segura

Este README não contém a URL ou informações de acesso da função ativa. A URL, quando existir, deve ser enviada somente no campo privado de comentários do Canvas.
