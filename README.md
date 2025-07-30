# 🧘‍♂️ SEJUSP Backend - Sistema de Agendamento

Sistema de agendamento de cadeiras de massagem com controle de acesso hierárquico e gerenciamento de sessões para a SEJUSP, desenvolvido com **Bun + Express + Prisma + MySQL + Docker**.

---

## 🛠️ Tecnologias Utilizadas

- **[Bun](https://bun.sh/)** - Runtime JavaScript rápido e moderno
- **[Express](https://expressjs.com/)** - Framework web para Node.js/TypeScript
- **[Prisma ORM](https://www.prisma.io/)** - ORM moderno para TypeScript e Node.js
- **[MySQL](https://www.mysql.com/)** - Banco de dados relacional
- **[Docker + Docker Compose](https://docs.docker.com/compose/)** - Containerização e orquestração
- **[JWT](https://jwt.io/)** - Autenticação por tokens
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Criptografia de senhas

---

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)
- [Bun](https://bun.sh/) (opcional, para desenvolvimento local)

---

## ⚙️ Configuração Inicial

### 1. Clone o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd backend
```

### 2. Configuração de Variáveis de Ambiente

O projeto está configurado para usar as variáveis de ambiente definidas no `docker-compose.yml`. Para funcionamento completo, configure as seguintes variáveis:

#### 📧 Configuração de Email (Mailtrap)

Para o sistema de emails automáticos funcionar, você precisa configurar as credenciais do Mailtrap no `docker-compose.yml`:

```yaml
environment:
  DATABASE_URL: mysql://root:root@db:3306/vibe-seat-db?connection_limit=50
  MAILTRAP_API_TOKEN: seu_token_da_api_mailtrap
  MAILTRAP_INBOX_ID: seu_inbox_id
  DEFAULT_FROM_EMAIL: noreply@sejusp.gov.br
```

#### Como obter as credenciais do Mailtrap:

1. **Crie uma conta** em [mailtrap.io](https://mailtrap.io)
2. **Acesse o Email Testing** no painel
3. **Crie ou acesse seu inbox**
4. **Copie as credenciais**:
   - `MAILTRAP_API_TOKEN`: Token da API na seção "API Tokens"
   - `MAILTRAP_INBOX_ID`: ID do inbox (número na URL ou seção "Settings")

#### ⚠️ Variáveis Obrigatórias para Email:

- `MAILTRAP_API_TOKEN` - Token de acesso à API do Mailtrap
- `MAILTRAP_INBOX_ID` - ID da caixa de entrada para testes
- `DEFAULT_FROM_EMAIL` - Email remetente padrão (opcional)

**Sem essas configurações**, o sistema funcionará normalmente, mas **não enviará emails automáticos** de:

- Criação de agendamento
- Confirmação de presença
- Lembretes de agendamento

**⚠️ Importante**: Não crie um arquivo `.env` local, pois isso pode causar conflitos com as configurações do Docker.

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
3. executa os comandos de seed-amin.ts e seed-days-of-week.ts
4. Executa bash dentro do container da aplicação

### Desenvolvimento Local

Para desenvolvimento local, é recomendado usar o Docker para manter a consistência do ambiente:

````bash
# Usar Docker
bun run start:docker

---

## 🗄️ Banco de Dados

### Migrations Prisma

Após alterar o schema em `prisma/schema.prisma`, gere uma nova migration:

```bash
bunx prisma migrate dev --name nome-da-migration
````

### Comandos Úteis

```bash
# Gerar cliente Prisma
bun run prisma:generate

# Executar migrations
bun run prisma:migrate

# Executar seed do admin
bun run seed:admin

# Executar seed dos dias da semana
bun run seed:days-of-week

# Formatação de código
bun run format

# Verificar formatação
bun run format:check

# Testes de performance
bun run test:performance

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
http://localhost(ou seu ip):3001
```

### Principais Módulos da API

- **Autenticação** (`/auth`) - Login e gerenciamento de tokens JWT
- **Usuários** (`/users`) - Gestão de usuários com campos completos
- **Aprovações** (`/approvals`) - Workflow de aprovação hierárquica
- **Cadeiras** (`/chairs`) - Gerenciamento de cadeiras de massagem
- **Agendamentos** (`/appointments`) - Sistema de booking com regras de negócio
- **Configurações** (`/schedules`) - Configuração global de horários
- **Dias da Semana** (`/days-of-week`) - Gestão de dias disponíveis
- **Roles** (`/roles`) - Controle de perfis e permissões
- **Dashboard** (`/dashboard`) - Analytics e visão geral do sistema
- **📧 Emails** - Sistema automático de notificações por email

### Arquitetura do Sistema

#### Hierarquia de Permissões

**user < attendant < admin**

- **Usuário (user)**: Criar e cancelar próprios agendamentos, visualizar horários disponíveis
- **Atendente (attendant)**: Todas as permissões de usuário + aprovar registros de usuários + confirmar presença
- **Administrador (admin)**: Todas as permissões + gerenciar cadeiras + configurar horários + aprovar atendentes

#### Modelos Principais

- **User**: Usuários com campos completos (CPF, matrícula, setor, etc.)
- **Role**: Perfis de acesso (admin, attendant, user)
- **UserApproval**: Workflow de aprovação com status pending/approved/rejected
- **Chair**: Cadeiras com status ACTIVE/MAINTENANCE/INACTIVE
- **ScheduleConfig**: Configuração global singleton com horários JSON
- **DayOfWeek**: Dias da semana disponíveis para agendamento
- **Appointment**: Agendamentos com status SCHEDULED/CANCELLED/CONFIRMED

#### Regras de Negócio

- **Agendamentos**: Máximo 1 agendamento ativo por usuário
- **Cancelamento**: Mínimo 3h de antecedência (exceto admins)
- **Duração**: 30 minutos por sessão
- **Aprovação**: Todos os usuários precisam ser aprovados antes do acesso
- **Soft Delete**: Todos os modelos implementam deleção suave

---

## 🐳 Docker

### Portas Utilizadas

- **3001** - Aplicação backend
- **3306** - MySQL

### Volumes

- `db_data` - Dados persistentes do MySQL

---

## 📝 Desenvolvimento

### Estrutura Modular

O projeto segue uma arquitetura modular em `src/modules/`:

```
src/modules/
├── auth/           # Autenticação JWT
├── user/           # Gestão de usuários
├── role/           # Controle de perfis
├── approval/       # Workflow de aprovação
├── chair/          # Gerenciamento de cadeiras
├── schedule/       # Configuração de horários
├── dayOfWeek/      # Dias da semana
├── appointment/    # Sistema de agendamentos
├── email/          # Sistema de emails automáticos
└── dashboard/      # Analytics e métricas
```

#### 📧 Sistema de Emails

O módulo de email (`src/modules/email/`) implementa:

- **email.service.ts** - Serviço principal usando Mailtrap REST API
- **email.templates.ts** - Templates HTML responsivos para emails
- **email.scheduler.ts** - Agendador para envio de lembretes
- **types.ts** - Tipos TypeScript para dados de email

**Funcionalidades:**

- ✅ Email de criação de agendamento
- ✅ Email de confirmação de presença
- ✅ Email de lembrete (1h antes do agendamento)
- ✅ Logs de email com status (PENDING/SENT/FAILED)
- ✅ Templates HTML com dados personalizados
- ✅ Prevenção de emails duplicados

Cada módulo contém:

- `*.controller.ts` - Controladores de requisições
- `*.service.ts` - Lógica de negócio

### Login para utilizar na primeira vez

- para logar pela primeira vez, após utilizar o comando bun run start:docker, você pode utilizar as seguintes credenciais
- "username": "admin"
- "password": "admin123"

### Adicionando Novas Funcionalidades

1. **Altere o Schema**: Atualize `prisma/schema.prisma`
2. **Crie Migration**: `bunx prisma migrate dev --name nome-da-migration`
3. **Implemente Módulo**: Siga o padrão controller → service → repository
4. **Configure Rotas**: Adicione em `src/index.ts`
5. **Teste**: Use Docker ou ambiente local

### Boas Práticas

- **Migrations**: Sempre gere após alterar schema
- **TypeScript**: Use tipagem forte em toda aplicação
- **Autenticação**: Todas as rotas protegidas usam middleware JWT
- **Validação**: Implemente validações nos controllers
- **Soft Delete**: Use deleção suave em todos os modelos

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
