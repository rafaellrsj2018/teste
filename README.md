# Checkpoint 1 - Função Serverless na Nuvem

Este projeto contém uma função serverless simples que responde a requisições HTTP e pode ser implantada em ambiente de nuvem.

## Provedor utilizado

* AWS Lambda com Amazon API Gateway

## Como rodar localmente

### Pré-requisitos

* Node.js instalado (versão 18 ou superior)
* Terminal de comandos aberto

### Passo a passo

1. Clone o repositório para sua máquina:
   ```bash
   git clone https://github.com/rafaellrsj2018/teste.git
   ```

2. Entre na pasta do projeto:
   ```bash
   cd teste
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

1. No console da AWS, crie uma função no serviço AWS Lambda usando o runtime Node.js 20.
2. Faça upload dos arquivos do projeto, mantendo `index.js` na raiz.
3. Configure o handler como `index.handler`.
4. Crie um trigger HTTP usando o Amazon API Gateway.
5. Teste a função pelo endpoint gerado pelo API Gateway.

## Observações importantes

- O README não contém a URL pública da função ativa.
- A URL da função em produção deve ser enviada apenas no campo privado do Canvas, conforme solicitado pelo professor.
