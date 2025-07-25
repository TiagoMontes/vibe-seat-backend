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

### 2. Configuração do Banco de Dados

O projeto está configurado para usar apenas o banco de dados do Docker. A variável `DATABASE_URL` é automaticamente definida no `docker-compose.yml`:

```env
DATABASE_URL=mysql://root:root@db:3306/vibe-seat-db?connection_limit=50
```

**⚠️ Importante**: Não crie um arquivo `.env` local, pois isso pode causar conflitos com o banco do Docker.

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

Para desenvolvimento local, é recomendado usar o Docker para manter a consistência do ambiente:

```bash
# Usar Docker (recomendado)
bun run start:docker

# Ou rodar apenas o banco localmente e a aplicação fora do container
docker compose up db -d
bun install
bun run prisma:generate
bun run prisma:migrate
bun run src/index.ts
```

**⚠️ Nota**: Se rodar localmente, certifique-se de que o MySQL local está configurado corretamente e use a mesma configuração do Docker.

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

# Executar seed do admin
bun run seed:admin

# Resetar banco de dados (limpa tudo e recria)
bun run db:reset

# Abrir Prisma Studio (interface visual do banco)
bun run prisma:studio
```

### Comandos no Docker

```bash
# Executar seed no container
docker exec backend-app-1 bun run seed:admin

# Executar migrations no container
docker exec backend-app-1 bun run prisma:migrate

# Conectar no MySQL do Docker
docker exec -it backend-db-1 mysql -u root -proot -e "SHOW DATABASES;"

# Ver logs do banco
docker logs backend-db-1

# Acessar bash do container da aplicação
docker exec -it backend-app-1 bash
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
