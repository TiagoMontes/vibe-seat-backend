# SEJUSP Backend - Documentação da API

## Visão Geral

Esta API gerencia o sistema de agendamento de cadeiras de massagem do SEJUSP com controle de acesso hierárquico, incluindo usuários, cadeiras, agendamentos, aprovações e configurações de horários.

## Base URL

```
http://localhost:3001
```

## Configuração de Timezone

O sistema utiliza configuração centralizada de timezone através de variáveis de ambiente no `docker-compose.yml`:

```yaml
environment:
  TIMEZONE: America/Rio_Branco    # Timezone padrão (UTC-5)
  # ou
  TZ: America/Rio_Branco          # Alternativo
```

**Timezones Suportados:**
- `America/Rio_Branco` - Acre (UTC-5) - padrão
- `America/Sao_Paulo` - São Paulo (UTC-3)
- `America/Fortaleza` - Ceará (UTC-3)
- `UTC` - UTC (UTC±0)

**Funcionalidades Afetadas:**
- ✅ Validação de horários de agendamento
- ✅ Sistema de emails automáticos
- ✅ Agendamento de lembretes (cron jobs)
- ✅ Logs e timestamps

**⚠️ Cron Jobs e Reinicialização:**

Quando você reinicia o Docker usando `bun run start:docker`, os cron jobs de lembretes são automaticamente reiniciados e continuam funcionando normalmente. O sistema utiliza timezone centralizado que é aplicado tanto para os cron jobs quanto para todo o sistema de emails.

## Autenticação

A API usa autenticação JWT Bearer Token. Após fazer login, use o token retornado no header `Authorization: Bearer <token>`.

## Hierarquia de Permissões

**user < attendant < admin**

### Usuário (user)

- Criar e cancelar próprios agendamentos (máx 1 ativo)
- Visualizar horários disponíveis
- Visualizar cadeiras e configurações
- Atualizar próprios dados

### Atendente (attendant)

- Todas as permissões de usuário
- Aprovar/rejeitar registros de usuários
- Visualizar e gerenciar todos os agendamentos
- Confirmar presença nas sessões
- Visualizar dashboard e analytics

### Administrador (admin)

- Todas as permissões de atendente
- Aprovar registros de atendentes
- Gerenciar cadeiras (criar, editar, deletar)
- Configurar horários e dias disponíveis
- Gerenciar roles e configurações do sistema

## Soft Delete Automático

Todos os endpoints de DELETE fazem **soft delete** automaticamente:

- Registros não são removidos do banco
- Campo `deletedAt` é preenchido com a data/hora atual
- Queries automáticas filtram registros com `deletedAt = null`

### Campos de Timestamp

Todos os models incluem automaticamente:

- `createdAt` - Data/hora de criação (preenchido automaticamente)
- `updatedAt` - Data/hora da última atualização (atualizado automaticamente)
- `deletedAt` - Data/hora de exclusão (null se não deletado)

---

## Endpoints

### 🔐 Autenticação

#### POST /auth/login

Realiza login do usuário e retorna token JWT.

**Autenticação:** Não requerida

**Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Sucesso - 200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Erro - 401 - Credenciais inválidas):**

```json
{
  "error": "Credenciais inválidas ou não aprovadas"
}
```

**Response (Erro - 401 - Senha incorreta):**

```json
{
  "error": "Senha incorreta"
}
```

---

### 👥 Usuários

#### GET /users

Lista todos os usuários com paginação opcional.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por qualquer campo do usuário (username, nome, CPF, email, etc.)
- `status` - Filtrar por status: `pending`, `approved`, `rejected`
- `roleId` - Filtrar por role específico
- `sortBy` - Ordenação: `newest`, `oldest`, `username-asc`, `username-desc`

**Exemplo com paginação:**

```
GET /users?page=1&limit=9&search=admin&status=approved&sortBy=newest
```

**Response com paginação:**

```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "status": "approved",
      "roleId": 1,
      "fullName": "Administrador do Sistema",
      "email": "admin@sejusp.go.gov.br",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z",
      "role": {
        "id": 1,
        "name": "admin"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 9,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "lastPage": 5
  },
  "stats": {
    "total": 45,
    "pending": 10,
    "approved": 30,
    "rejected": 5
  }
}
```

#### POST /users

Cria um novo usuário com campos completos.

**Autenticação:** Não requerida (rota pública para registro)

**Body (Campos obrigatórios):**

```json
{
  "username": "joao.silva",
  "password": "senha123",
  "roleId": 2,
  "fullName": "João Silva Santos",
  "cpf": "123.456.789-00",
  "jobFunction": "Servidor Público",
  "position": "Analista",
  "registration": "12345",
  "sector": "Tecnologia da Informação",
  "email": "joao.silva@sejusp.go.gov.br",
  "phone": "(62) 99999-9999",
  "gender": "M",
  "birthDate": "1990-01-01"
}
```

**Response (Sucesso - 201):**

```json
{
  "success": true,
  "message": "Usuário criado com sucesso. Aguarde aprovação.",
  "data": {
    "id": 15,
    "username": "joao.silva",
    "status": "pending",
    "fullName": "João Silva Santos",
    "createdAt": "2025-01-27T10:00:00.000Z"
  }
}
```

**Response (Erro - 400 - Campo obrigatório):**

```json
{
  "success": false,
  "message": "Campo obrigatório ausente: fullName",
  "error": true
}
```

**Response (Erro - 400 - Email inválido):**

```json
{
  "success": false,
  "message": "E-mail inválido",
  "error": true
}
```

**Response (Erro - 400 - CPF inválido):**

```json
{
  "success": false,
  "message": "CPF deve estar no formato XXX.XXX.XXX-XX ou apenas números",
  "error": true
}
```

**Response (Erro - 400 - Dados duplicados):**

```json
{
  "success": false,
  "message": "Username já existe",
  "error": true
}
```

#### GET /users/:id

Busca usuário por ID.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Usuário encontrado",
  "data": {
    "id": 1,
    "username": "admin",
    "status": "approved",
    "roleId": 1,
    "fullName": "Administrador do Sistema",
    "email": "admin@sejusp.go.gov.br",
    "role": {
      "id": 1,
      "name": "admin"
    }
  }
}
```

**Response (Erro - 400):**

```json
{
  "success": false,
  "message": "ID inválido",
  "error": true
}
```

**Response (Erro - 404):**

```json
{
  "success": false,
  "message": "Usuário não encontrado",
  "data": null,
  "error": true
}
```

#### PATCH /users/:id

Atualiza dados do usuário.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Próprio usuário ou administrador

**Body (Todos os campos opcionais):**

```json
{
  "username": "novo_username",
  "password": "nova_senha",
  "fullName": "Novo Nome Completo",
  "email": "novo.email@sejusp.go.gov.br",
  "phone": "(62) 88888-8888",
  "sector": "Novo Setor"
}
```

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Usuário atualizado com sucesso",
  "data": {
    "id": 1,
    "username": "novo_username",
    "fullName": "Novo Nome Completo",
    "email": "novo.email@sejusp.go.gov.br",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

**Response (Erro - 400):**

```json
{
  "success": false,
  "message": "ID inválido",
  "error": true
}
```

**Response (Erro - 404):**

```json
{
  "success": false,
  "message": "Usuário não encontrado",
  "error": true
}
```

#### DELETE /users/:id

Deleta um usuário (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Usuário excluído com sucesso",
  "deletedId": 1
}
```

**Response (Erro - 400):**

```json
{
  "success": false,
  "message": "ID inválido",
  "error": true
}
```

**Response (Erro - 404):**

```json
{
  "success": false,
  "message": "Usuário não encontrado",
  "error": true
}
```

---

### 🪑 Cadeiras

#### GET /chairs

Lista todas as cadeiras com paginação opcional.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por nome, descrição ou localização
- `status` - Filtrar por status: `ACTIVE`, `MAINTENANCE`, `INACTIVE`
- `sortBy` - Ordenação: `newest`, `oldest`, `name-asc`, `name-desc`

**Exemplo:**

```
GET /chairs?page=1&limit=9&search=sala&status=ACTIVE&sortBy=newest
```

#### GET /chairs/insights

Retorna analytics e insights das cadeiras.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

#### POST /chairs

Cria uma nova cadeira.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body:**

```json
{
  "name": "Cadeira Sala A-01",
  "description": "Cadeira de massagem na sala principal",
  "location": "Sala A - 1º andar",
  "status": "ACTIVE"
}
```

#### GET /chairs/:id

Busca cadeira por ID.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

#### PATCH /chairs/:id

Atualiza uma cadeira.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body (Campos opcionais):**

```json
{
  "name": "Cadeira Sala A-01 Atualizada",
  "description": "Nova descrição",
  "location": "Nova localização",
  "status": "MAINTENANCE"
}
```

#### DELETE /chairs/:id

Deleta uma cadeira (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

---

### 📅 Agendamentos

#### GET /appointments

Lista todos os agendamentos com paginação opcional.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por username, nome da cadeira ou localização
- `status` - Filtrar por status: `SCHEDULED`, `CANCELLED`, `CONFIRMED`
- `sortBy` - Ordenação: `newest`, `oldest`, `datetime-asc`, `datetime-desc`

**Exemplo:**

```
GET /appointments?page=1&limit=9&search=admin&status=SCHEDULED&sortBy=newest
```

#### 📧 Sistema de Emails Automáticos

O sistema envia emails automáticos para os usuários em três momentos:

1. **Email de Criação** - Enviado quando um agendamento é criado
2. **Email de Confirmação** - Enviado quando o atendente confirma a presença
3. **Email de Lembrete** - Enviado 1 hora antes do agendamento (via scheduler)

**Configuração de Email:**

- **Provedor**: Mailtrap (ambiente de desenvolvimento/teste)
- **API**: REST API do Mailtrap
- **Templates**: HTML responsivos com dados do agendamento
- **Logs**: Todos os emails são registrados na tabela `EmailLog`
- **Timezone**: Utiliza configuração centralizada do sistema
- **Cron Jobs**: Agendador automático para lembretes (1h antes do agendamento)
- **Reinicialização**: Cron jobs são automaticamente reiniciados com o container

**Dados incluídos nos emails:**

- Nome do usuário
- Data e horário do agendamento
- Nome e localização da cadeira
- Status do agendamento
- Instruções relevantes

**Estados dos emails:**

- `PENDING`: Email criado, aguardando envio
- `SENT`: Email enviado com sucesso
- `FAILED`: Falha no envio do email

#### GET /appointments/my-appointments

Lista agendamentos do usuário logado com estatísticas.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Response:**

```json
{
  "appointments": [...],
  "total": 10,
  "scheduled": 3,
  "confirmed": 5,
  "confirmedUpcoming": 2,
  "confirmedDone": 3,
  "cancelled": 2,
  "message": "Agendamentos do usuário logado"
}
```

#### GET /appointments/allStatus

Lista agendamentos com todos os status.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

#### POST /appointments/available-times

Retorna horários disponíveis para uma data específica.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Body:**

```json
{
  "date": "2025-01-27"
}
```

**Response:**

```json
{
  "chairs": [
    {
      "chairId": 1,
      "chairName": "Cadeira 1",
      "chairLocation": "Sala A",
      "available": ["2025-01-27T08:00:00.000Z", "2025-01-27T08:30:00.000Z"],
      "unavailable": ["2025-01-27T09:00:00.000Z"],
      "totalSlots": 16,
      "bookedSlots": 1,
      "availableSlots": 15
    }
  ],
  "totalSlots": 16,
  "bookedSlots": 5,
  "availableSlots": 75
}
```

#### POST /appointments

Cria um novo agendamento.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Regras de Negócio:**

- Máximo 1 agendamento ativo por usuário
- Horário deve estar dentro da configuração de funcionamento
- Cadeira deve estar disponível no horário

**Body:**

```json
{
  "chairId": 1,
  "datetimeStart": "2025-01-27T08:00:00.000Z"
}
```

**Response (Sucesso - 201):**

```json
{
  "success": true,
  "message": "Agendamento criado com sucesso",
  "data": {
    "id": 25,
    "userId": 5,
    "chairId": 1,
    "datetimeStart": "2025-01-27T08:00:00.000Z",
    "datetimeEnd": "2025-01-27T08:30:00.000Z",
    "status": "SCHEDULED",
    "createdAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### PATCH /appointments/:id/cancel

Cancela um agendamento.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Próprio usuário ou atendente/admin

**Regras de Negócio:**

- Cancelamento com mínimo 3h de antecedência (exceto admins)
- Apenas agendamentos com status SCHEDULED podem ser cancelados

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso",
  "data": {
    "id": 25,
    "status": "CANCELLED",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

**Response (Erro - 400 - ID inválido):**

```json
{
  "success": false,
  "message": "ID inválido",
  "error": true
}
```

**Response (Erro - 400 - Regra de negócio):**

```json
{
  "success": false,
  "message": "Cancelamento deve ser feito com pelo menos 3 horas de antecedência",
  "error": true
}
```

**Response (Erro - 404):**

```json
{
  "success": false,
  "message": "Agendamento não encontrado",
  "error": true
}
```

#### PATCH /appointments/:id/confirm

Confirma presença do usuário na sessão.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Agendamento confirmado com sucesso",
  "data": {
    "id": 25,
    "status": "CONFIRMED",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

**Response (Erro - 400):**

```json
{
  "success": false,
  "message": "ID inválido",
  "error": true
}
```

**Response (Erro - 404):**

```json
{
  "success": false,
  "message": "Agendamento não encontrado",
  "error": true
}
```

---

### ✅ Aprovações

#### GET /approvals

Lista todas as aprovações com paginação opcional.

**Autenticação:** Requerida (JWT)
**Autorização:** Atendente ou superior

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por username ou nome do role
- `status` - Filtrar por status: `pending`, `approved`, `rejected`
- `sortBy` - Ordenação: `newest`, `oldest`, `user-asc`, `user-desc`

**Exemplo:**

```
GET /approvals?page=1&limit=9&search=admin&status=pending&sortBy=newest
```

#### GET /approvals/pending

Lista apenas aprovações pendentes (sem paginação).

**Autenticação:** Requerida (JWT)
**Autorização:** Atendente ou superior

#### GET /approvals/:id

Busca aprovação por ID.

**Autenticação:** Requerida (JWT)
**Autorização:** Atendente ou superior

#### PATCH /approvals/:id

Atualiza status da aprovação.

**Autenticação:** Requerida (JWT)
**Autorização:** Atendente (para usuários) ou Admin (para atendentes)

**Regras de Negócio:**

- Atendentes podem aprovar registros de usuários
- Administradores podem aprovar registros de atendentes
- Administradores podem aprovar qualquer registro

**Body:**

```json
{
  "status": "approved"
}
```

---

### 📅 Dias da Semana

#### GET /days-of-week

Lista todos os dias da semana com paginação opcional.

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por nome do dia
- `sortBy` - Ordenação: `newest`, `oldest`, `name-asc`, `name-desc`

#### POST /days-of-week

Cria um novo dia da semana.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body:**

```json
{
  "name": "saturday"
}
```

#### GET /days-of-week/:id

Busca dia da semana por ID.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

#### PATCH /days-of-week/:id

Atualiza um dia da semana.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body:**

```json
{
  "name": "saturday"
}
```

#### DELETE /days-of-week/:id

Deleta um dia da semana (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

#### DELETE /days-of-week

Deleta múltiplos dias da semana (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body:**

```json
{
  "ids": [1, 2, 3]
}
```

---

## 📋 Documentação Completa - Endpoints `/schedules`

### ⏰ Configurações de Horário

#### GET /schedules

Retorna a configuração de horário atual (singleton global).

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Qualquer usuário aprovado

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Configuração de agenda encontrada",
  "data": {
    "id": 1,
    "timeRanges": [
      {
        "start": "08:00",
        "end": "10:00"
      },
      {
        "start": "14:00",
        "end": "16:00"
      },
      {
        "start": "18:00",
        "end": "20:00"
      }
    ],
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z",
    "deletedAt": null,
    "days": [
      {
        "id": 1,
        "name": "monday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T10:00:00.000Z",
        "deletedAt": null
      },
      {
        "id": 2,
        "name": "tuesday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T10:00:00.000Z",
        "deletedAt": null
      }
    ]
  }
}
```

**Response (Erro - 404 - Configuração não encontrada):**

```json
{
  "success": false,
  "message": "Nenhuma configuração de agenda encontrada",
  "data": null,
  "error": true
}
```

**Response (Erro - 500 - Erro interno):**

```json
{
  "success": false,
  "message": "Erro interno do servidor",
  "error": true
}
```

---

#### GET /schedules/:id

Retorna a configuração de horário por ID (sempre ID = 1, pois é singleton).

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Qualquer usuário aprovado

**Response (Sucesso - 200):**
_Mesma estrutura do GET /schedules_

**Response (Erro - 404 - Configuração não encontrada):**
_Mesma estrutura do GET /schedules_

**Response (Erro - 500 - Erro interno):**
_Mesma estrutura do GET /schedules_

---

#### POST /schedules

Cria a configuração de horário (apenas se não existir nenhuma).

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Apenas administradores

**Body:**

```json
{
  "timeRanges": [
    {
      "start": "08:00",
      "end": "10:00"
    },
    {
      "start": "14:00",
      "end": "16:00"
    },
    {
      "start": "18:00",
      "end": "20:00"
    }
  ],
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validTo": "2025-12-31T23:59:59.000Z",
  "dayIds": [1, 2, 3, 4, 5]
}
```

**Response (Sucesso - 201):**

```json
{
  "success": true,
  "message": "Configuração de agenda criada com sucesso",
  "data": {
    "id": 1,
    "timeRanges": [
      {
        "start": "08:00",
        "end": "10:00"
      },
      {
        "start": "14:00",
        "end": "16:00"
      },
      {
        "start": "18:00",
        "end": "20:00"
      }
    ],
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z",
    "deletedAt": null,
    "days": [
      {
        "id": 1,
        "name": "monday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T10:00:00.000Z",
        "deletedAt": null
      }
    ]
  }
}
```

**Response (Erro - 400 - Configuração já existe):**

```json
{
  "success": false,
  "message": "Já existe uma configuração de agenda.",
  "error": true
}
```

**Response (Erro - 400 - Sobreposição de horários):**

```json
{
  "success": false,
  "message": "Existe sobreposição entre os horários configurados.",
  "error": true
}
```

**Response (Erro - 400 - Dias não encontrados):**

```json
{
  "success": false,
  "message": "Dias da semana não encontrados: 6, 7",
  "error": true
}
```

**Response (Erro - 400 - Erro genérico):**

```json
{
  "success": false,
  "message": "Erro ao criar configuração de agenda",
  "error": true
}
```

---

#### PATCH /schedules/:id

Atualiza a configuração de horário existente.

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Apenas administradores

**Body (Campos opcionais):**

```json
{
  "timeRanges": [
    {
      "start": "09:00",
      "end": "11:00"
    },
    {
      "start": "15:00",
      "end": "17:00"
    }
  ],
  "validFrom": "2025-02-01T00:00:00.000Z",
  "validTo": "2025-12-31T23:59:59.000Z",
  "dayIds": [1, 3, 5]
}
```

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Configuração de agenda atualizada com sucesso",
  "data": {
    "id": 1,
    "timeRanges": [
      {
        "start": "09:00",
        "end": "11:00"
      },
      {
        "start": "15:00",
        "end": "17:00"
      }
    ],
    "validFrom": "2025-02-01T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T11:00:00.000Z",
    "deletedAt": null,
    "days": [
      {
        "id": 1,
        "name": "monday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T11:00:00.000Z",
        "deletedAt": null
      }
    ]
  }
}
```

**Response (Erro - 404 - Configuração não encontrada):**

```json
{
  "success": false,
  "message": "Nenhuma configuração encontrada para atualizar.",
  "error": true
}
```

**Response (Erro - 400 - Sobreposição de horários):**

```json
{
  "success": false,
  "message": "Existe sobreposição entre os horários configurados.",
  "error": true
}
```

**Response (Erro - 400 - Dias não encontrados):**

```json
{
  "success": false,
  "message": "Dias da semana não encontrados: 6, 7",
  "error": true
}
```

**Response (Erro - 400 - Erro genérico):**

```json
{
  "success": false,
  "message": "Erro ao atualizar configuração de agenda",
  "error": true
}
```

---

#### PATCH /schedules/:id/days

Atualiza apenas os dias da semana vinculados à configuração.

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Apenas administradores

**Body:**

```json
{
  "dayIds": [1, 2, 3, 4, 5]
}
```

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Dias da semana atualizados com sucesso",
  "data": {
    "id": 1,
    "timeRanges": [
      {
        "start": "08:00",
        "end": "10:00"
      }
    ],
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T11:00:00.000Z",
    "deletedAt": null,
    "days": [
      {
        "id": 1,
        "name": "monday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T11:00:00.000Z",
        "deletedAt": null
      },
      {
        "id": 2,
        "name": "tuesday",
        "scheduleConfigId": 1,
        "createdAt": "2025-01-27T10:00:00.000Z",
        "updatedAt": "2025-01-27T11:00:00.000Z",
        "deletedAt": null
      }
    ]
  }
}
```

**Response (Erro - 400 - Configuração não encontrada):**

```json
{
  "success": false,
  "message": "Nenhuma configuração encontrada para atualizar.",
  "error": true
}
```

**Response (Erro - 400 - Dias não encontrados):**

```json
{
  "success": false,
  "message": "Dias da semana não encontrados: 6, 7",
  "error": true
}
```

**Response (Erro - 400 - dayIds inválido):**

```json
{
  "success": false,
  "message": "dayIds deve ser um array de números",
  "error": true
}
```

**Response (Erro - 400 - Erro genérico):**

```json
{
  "success": false,
  "message": "Erro ao atualizar dias da semana",
  "error": true
}
```

---

#### DELETE /schedules/:id

Remove a configuração de horário existente (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)  
**Autorização:** Apenas administradores

**Response (Sucesso - 200):**

```json
{
  "success": true,
  "message": "Configuração de agenda removida com sucesso"
}
```

**Response (Erro - 404 - Configuração não encontrada):**

```json
{
  "success": false,
  "message": "Nenhuma configuração encontrada para deletar.",
  "error": true
}
```

**Response (Erro - 500 - Erro interno):**

```json
{
  "success": false,
  "message": "Erro ao remover configuração de agenda",
  "error": true
}
```

---

## 🔍 Tratamento no Frontend

### Exemplo de Hook React para Schedules

```javascript
import { useState } from 'react';

const useScheduleApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/schedules');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao buscar configuração';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async scheduleData => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/schedules', scheduleData);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao criar configuração';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id, scheduleData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/schedules/${id}`, scheduleData);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao atualizar configuração';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async id => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/schedules/${id}`);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao remover configuração';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading,
    error,
  };
};
```

### Tratamento de Erros Específicos

```javascript
const handleScheduleError = error => {
  const { response } = error;

  if (response) {
    const { status, data } = response;

    switch (status) {
      case 400:
        if (data.message.includes('Já existe uma configuração')) {
          showError('Uma configuração já existe. Use a opção de editar.');
        } else if (data.message.includes('sobreposição')) {
          showError(
            'Os horários configurados se sobrepõem. Verifique os intervalos.'
          );
        } else if (data.message.includes('Dias da semana não encontrados')) {
          showError('Alguns dias selecionados não existem no sistema.');
        } else {
          showError(data.message);
        }
        break;
      case 404:
        if (data.message.includes('Nenhuma configuração encontrada')) {
          showInfo(
            'Nenhuma configuração encontrada. Crie uma nova configuração.'
          );
        } else {
          showError(data.message);
        }
        break;
      case 500:
        showError('Erro interno do servidor. Tente novamente.');
        break;
      default:
        showError('Erro inesperado. Tente novamente.');
    }
  } else {
    showError('Erro de conexão. Verifique sua internet.');
  }
};
```

### Validações de Entrada

```javascript
const validateScheduleData = data => {
  const errors = [];

  // Validar timeRanges
  if (
    !data.timeRanges ||
    !Array.isArray(data.timeRanges) ||
    data.timeRanges.length === 0
  ) {
    errors.push('Pelo menos um intervalo de horário deve ser configurado');
  }

  // Validar formato dos horários
  data.timeRanges?.forEach((range, index) => {
    if (!range.start || !range.end) {
      errors.push(
        `Intervalo ${index + 1}: horários de início e fim são obrigatórios`
      );
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(range.start) || !timeRegex.test(range.end)) {
      errors.push(
        `Intervalo ${index + 1}: formato de horário inválido (use HH:MM)`
      );
    }

    if (range.start >= range.end) {
      errors.push(
        `Intervalo ${index + 1}: horário de início deve ser menor que o fim`
      );
    }
  });

  // Validar dayIds
  if (!data.dayIds || !Array.isArray(data.dayIds) || data.dayIds.length === 0) {
    errors.push('Pelo menos um dia da semana deve ser selecionado');
  }

  return errors;
};
```

Esta documentação fornece todas as possíveis respostas de cada endpoint do módulo `/schedules`, permitindo um tratamento completo no frontend.

---

## Padrões de Resposta Unificados

### Estrutura Padrão de Resposta de Sucesso

Todas as respostas de sucesso seguem o padrão:

```json
{
  "success": true,
  "message": "Mensagem descritiva da operação",
  "data": {...} // Dados retornados (opcional)
}
```

**Campos adicionais por contexto:**

- `total`: Número total de itens (em listagens simples)
- `pagination`: Objeto de paginação (em listagens paginadas)
- `deletedId` ou `deletedIds`: ID(s) do(s) item(ns) deletado(s)
- `count`: Número de itens afetados em operações em lote

### Estrutura Padrão de Resposta de Erro

Todas as respostas de erro seguem o padrão:

```json
{
  "success": false,
  "message": "Mensagem descritiva do erro",
  "error": true,
  "data": null // Opcional, apenas quando relevante
}
```

### Códigos de Status HTTP

- `200` - Operação realizada com sucesso
- `201` - Recurso criado com sucesso
- `400` - Erro de validação ou dados inválidos
- `401` - Não autorizado (credenciais inválidas)
- `403` - Acesso negado (sem permissão)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

### Exemplos de Respostas por Tipo de Operação

#### CREATE (POST) - Sucesso (201)

```json
{
  "success": true,
  "message": "Recurso criado com sucesso",
  "data": {
    "id": 1,
    "name": "Nome do recurso",
    "createdAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### READ (GET) - Sucesso (200)

```json
{
  "success": true,
  "message": "Recursos listados com sucesso",
  "data": [...],
  "total": 10
}
```

#### UPDATE (PATCH) - Sucesso (200)

```json
{
  "success": true,
  "message": "Recurso atualizado com sucesso",
  "data": {
    "id": 1,
    "name": "Nome atualizado",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }
}
```

#### DELETE - Sucesso (200)

```json
{
  "success": true,
  "message": "Recurso excluído com sucesso",
  "deletedId": 1
}
```

#### Erro de Validação (400)

```json
{
  "success": false,
  "message": "Campo obrigatório ausente: email",
  "error": true
}
```

#### Erro de Autorização (401)

```json
{
  "success": false,
  "message": "Credenciais inválidas",
  "error": true
}
```

#### Recurso Não Encontrado (404)

```json
{
  "success": false,
  "message": "Usuário não encontrado",
  "data": null,
  "error": true
}
```

#### Erro Interno do Servidor (500)

```json
{
  "success": false,
  "message": "Erro interno do servidor",
  "error": true
}
```

---

## Guia de Implementação Frontend

### Tratamento Unificado de Respostas

Para facilitar o tratamento no frontend, todas as respostas seguem padrões consistentes:

#### Verificação de Sucesso

```javascript
// Verificar se a operação foi bem-sucedida
if (response.data.success) {
  // Operação realizada com sucesso
  console.log(response.data.message);
  const data = response.data.data; // Dados retornados
} else {
  // Erro ocorreu
  console.error(response.data.message);
  // Exibir mensagem de erro para o usuário
}
```

#### Tratamento de Erros por Status HTTP

```javascript
try {
  const response = await api.post('/users', userData);
  if (response.data.success) {
    // Sucesso - processar response.data.data
  }
} catch (error) {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        // Erro de validação - mostrar data.message
        showValidationError(data.message);
        break;
      case 401:
        // Não autorizado - redirecionar para login
        redirectToLogin();
        break;
      case 403:
        // Sem permissão - mostrar mensagem de acesso negado
        showAccessDenied();
        break;
      case 404:
        // Não encontrado - mostrar data.message
        showNotFound(data.message);
        break;
      case 500:
        // Erro do servidor - mostrar mensagem genérica
        showServerError();
        break;
      default:
        showGenericError();
    }
  } else {
    // Erro de rede
    showNetworkError();
  }
}
```

#### Exemplo de Hook React para API

```javascript
import { useState } from 'react';

const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async apiFunction => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction();

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Erro inesperado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
};
```

### Mensagens de Erro Comuns

**Validação de Dados:**

- "Campo obrigatório ausente: [campo]"
- "E-mail inválido"
- "CPF deve estar no formato XXX.XXX.XXX-XX"
- "ID inválido"

**Autorização:**

- "Credenciais inválidas ou não aprovadas"
- "Acesso negado"

**Recursos:**

- "[Recurso] não encontrado"
- "[Recurso] criado com sucesso"
- "[Recurso] atualizado com sucesso"
- "[Recurso] excluído com sucesso"

**Agendamentos:**

- "Você já possui um agendamento ativo"
- "Cancelamento deve ser feito com pelo menos 3 horas de antecedência"
- "Horário não está disponível"

## Estrutura de Paginação

Todos os endpoints que suportam paginação retornam a seguinte estrutura:

```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 9,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "lastPage": 5
  }
}
```

## Como usar no Postman/Insomnia

1. Importe o arquivo `api-collection.json`
2. Configure a variável `localhost` para `http://localhost:3001`
3. Faça login usando o endpoint `/auth/login`
4. Copie o token retornado e configure a variável `token`
5. Todos os outros endpoints usarão automaticamente o token de autenticação

### Variáveis de Ambiente

```json
{
  "localhost": "http://localhost:3001",
  "token": "seu_jwt_token_aqui"
}
```

## Exemplos de Uso

### 1. Login e Configuração do Token

```bash
# 1. Fazer login
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}

# 2. Copiar o token da resposta e configurar na variável 'token'
```

### 2. Registrar Novo Usuário

```bash
POST /users
{
  "username": "joao.silva",
  "password": "senha123",
  "roleId": 2,
  "fullName": "João Silva Santos",
  "cpf": "123.456.789-00",
  "jobFunction": "Servidor Público",
  "position": "Analista",
  "registration": "12345",
  "sector": "Tecnologia da Informação",
  "email": "joao.silva@sejusp.go.gov.br",
  "phone": "(62) 99999-9999",
  "gender": "M",
  "birthDate": "1990-01-01"
}
```

### 3. Listar Cadeiras com Paginação

```bash
GET /chairs?page=1&limit=9&status=ACTIVE&sortBy=newest
```

### 4. Buscar Horários Disponíveis

```bash
POST /appointments/available-times
{
  "date": "2025-01-27"
}
```

### 5. Criar um Agendamento

```bash
POST /appointments
{
  "chairId": 1,
  "datetimeStart": "2025-01-27T08:00:00.000Z"
}
```

### 6. Aprovar um Usuário

```bash
PATCH /approvals/1
{
  "status": "approved"
}
```

## Cadastro de Usuário

Todos os usuários devem preencher os seguintes campos obrigatórios:

- **fullName**: Nome completo
- **cpf**: CPF (formato: 123.456.789-00)
- **jobFunction**: Função
- **position**: Cargo
- **registration**: Matrícula (campo único)
- **sector**: Setor
- **email**: E-mail institucional (campo único)
- **phone**: Telefone (formato: (62) 99999-9999)
- **gender**: Sexo (valores: "M", "F", "Outro")
- **birthDate**: Data de nascimento (formato: YYYY-MM-DD)

## Validações Implementadas

- **Email**: Formato válido e único
- **CPF**: Formato válido e único
- **Username**: Único no sistema
- **Registration**: Único no sistema
- **Gender**: Deve ser "M", "F" ou "Outro"
- **Password**: Criptografado automaticamente com bcrypt

## Funcionalidade de Busca

A busca de usuários funciona em todos os campos:

- Username, nome completo, CPF, email
- Função, cargo, matrícula, setor
- Telefone e dados pessoais

```bash
# Exemplo de busca
GET /users?search=joao&page=1&limit=9
```
