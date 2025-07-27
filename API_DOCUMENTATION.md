# SEJUSP Backend - Documentação da API

## Visão Geral

Esta API gerencia o sistema de agendamento de cadeiras de massagem do SEJUSP com controle de acesso hierárquico, incluindo usuários, cadeiras, agendamentos, aprovações e configurações de horários.

## Base URL

```
http://localhost:3001
```

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Administrador do Sistema",
    "status": "approved",
    "role": {
      "id": 1,
      "name": "admin"
    }
  }
}
```

**Response (Erro - 401):**

```json
{
  "success": false,
  "message": "Credenciais inválidas",
  "error": true
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

Cria um novo usuário com campos RF02 completos.

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

#### GET /users/:id

Busca usuário por ID.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

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

#### DELETE /users/:id

Deleta um usuário (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

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

#### PATCH /appointments/:id/confirm

Confirma presença do usuário na sessão.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

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

### ⏰ Configurações de Horário

#### GET /schedules

Retorna a configuração de horário atual (singleton global).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Response:**

```json
{
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
  "days": [
    {
      "id": 1,
      "name": "monday"
    },
    {
      "id": 2,
      "name": "tuesday"
    },
    {
      "id": 3,
      "name": "wednesday"
    }
  ]
}
```

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

#### PATCH /schedules

Atualiza a configuração de horário existente.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Body:**

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

#### DELETE /schedules

Remove a configuração de horário existente (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

**Response:**

```json
{
  "success": true,
  "message": "Configuração removida com sucesso"
}
```

---

### 🔗 Roles

#### GET /roles

Lista todos os roles disponíveis.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

#### POST /roles

Cria um novo role.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

#### GET /roles/:id

Busca role por ID.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Atendente ou superior

#### PATCH /roles/:id

Atualiza um role.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

#### DELETE /roles/:id

Deleta um role (soft delete).

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Apenas administradores

---

### 📊 Dashboard

#### GET /dashboard

Retorna dados do dashboard com analytics do sistema.

**Autenticação:** Requerida (JWT + status aprovado)
**Autorização:** Qualquer usuário aprovado

**Response:**

```json
{
  "overview": {
    "totalUsers": 45,
    "totalChairs": 25,
    "totalAppointments": 120,
    "pendingApprovals": 10
  },
  "today": {
    "appointments": 8
  },
  "tomorrow": {
    "appointments": 12
  },
  "chairs": {
    "total": 25,
    "active": 20,
    "maintenance": 3,
    "inactive": 2
  },
  "appointments": {
    "total": 120,
    "scheduled": 30,
    "confirmed": 80,
    "cancelled": 10,
    "confirmedUpcoming": 25,
    "confirmedDone": 55
  },
  "userAppointments": {
    "total": 5,
    "scheduled": 2,
    "confirmed": 3,
    "cancelled": 0,
    "confirmedUpcoming": 1,
    "confirmedDone": 2
  },
  "recentAppointments": [...],
  "lastUpdated": "2025-01-27T10:00:00.000Z"
}
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno do servidor

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

## Campos RF02 - Cadastro de Usuário

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