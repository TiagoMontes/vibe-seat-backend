# 🧘‍♂️ Vibe Seat Backend

Sistema de agendamento de cadeiras de massagem com controle de acesso por perfis e gerenciamento de sessões, feito com **Bun + Express + Prisma + MySQL + Docker**.

---

## 🛠️ Tecnologias Utilizadas

- [Bun](https://bun.sh/) - Runtime JavaScript rápido e moderno
- [Express](https://expressjs.com/) - Framework web para Node.js
- [Prisma ORM](https://www.prisma.io/) - ORM moderno para TypeScript e Node.js
- [MySQL](https://www.mysql.com/) - Banco de dados relacional
- [Docker + Docker Compose](https://docs.docker.com/compose/) - Containerização e orquestração

---

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)
- [Bun](https://bun.sh/) (opcional, para desenvolvimento local)

---

## ⚙️ Configuração Inicial

### 1. Clone o projeto

```bash
git clone https://github.com/TiagoMontes/vibe-seat-backend.git
cd vibe-seat-backend
```

### 2. Configure o arquivo .env

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

```env
DB_USER=root
DB_PASSWORD=root
DB_HOST=db
DB_PORT=3306
DB_NAME=vibe_seat

DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
```

---

## 🚀 Executando o Projeto

### Rodando com Docker (Recomendado)

Para subir a aplicação com banco de dados e entrar no container:

```bash
bun run start:docker
```

Este script faz automaticamente:

1. `docker compose build` - Constrói as imagens
2. `docker compose up -d` - Sobe os containers em background
3. Executa bash dentro do container da aplicação

### Desenvolvimento Local

Se preferir rodar localmente:

```bash
# Instalar dependências
bun install

# Gerar cliente Prisma
bun run prisma:generate

# Executar migrations
bun run prisma:migrate

# Rodar aplicação
bun run src/index.ts
```

---

## 🗄️ Banco de Dados

### Migrations Prisma

Após alterar o schema em `prisma/schema.prisma`, gere uma nova migration:

```bash
bunx prisma migrate dev --name nome-da-migration
```

### Comandos Úteis

```bash
# Gerar cliente Prisma
bun run prisma:generate

# Executar migrations
bun run prisma:migrate

# Abrir Prisma Studio (interface visual do banco)
bun run prisma:studio
```

---

## 🌐 Endpoints da API

### Base URL

```
http://localhost:3001
```

### Endpoints Disponíveis

- `GET /` - Status da API
- _Outros endpoints serão implementados conforme o desenvolvimento_

---

## 🐳 Docker

### Portas Utilizadas

- **3001** - Aplicação backend
- **3306** - MySQL

### Volumes

- `db_data` - Dados persistentes do MySQL

---

## 📝 Desenvolvimento

### Adicionando Novas Funcionalidades

1. Atualize o schema do Prisma em `prisma/schema.prisma`
2. Gere uma nova migration: `bunx prisma migrate dev --name nome-da-migration`
3. Implemente os endpoints em `src/index.ts`
4. Teste localmente ou com Docker

### Boas Práticas

- Sempre gere migrations após alterar o schema
- Use TypeScript para type safety
- Mantenha o Docker Compose atualizado
- Documente novos endpoints

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
