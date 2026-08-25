# Checkpoint 1 - Função Serverless na Nuvem

Este projeto contém uma função serverless simples que responde a requisições HTTP e pode ser implantada em ambiente de nuvem.

## Provedor utilizado

* GCP (Google Cloud Functions)

## Como rodar localmente

### Pré-requisitos

* Node.js instalado (versão 18 ou superior)
* Terminal de comandos aberto

### Passo a passo

1. Clone o repositório para sua máquina:
   ```bash
   git clone https://github.com/seu-usuario/cloud-serverless-checkpoint1.git
   ```

2. Entre na pasta do projeto:
   ```bash
   cd cloud-serverless-checkpoint1
   ```

3. Instale as dependências do projeto:
   ```bash
   npm install
   ```

4. Rode o servidor local para testes:
   ```bash
   npm start
   ```

5. Acesse a função localmente:
   ```bash
   http://localhost:3000/?name=Aluno
   ```

### Exemplos de uso

#### GET
```bash
curl "http://localhost:3000/?name=Aluno"
```

#### POST
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"message":"checkpoint"}'
```

## Como implantar na nuvem

Este código pode ser usado em uma função HTTP do Google Cloud Functions. O ponto principal é exportar a função principal e responder com `req` e `res` em JSON.

## Observações importantes

- O README não contém a URL pública da função ativa.
- A URL da função em produção deve ser enviada apenas no campo privado do Canvas, conforme solicitado pelo professor.
