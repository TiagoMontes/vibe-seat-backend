# SEJUSP Backend API Documentation

## Visão Geral

Esta API gerencia o sistema de agendamentos do SEJUSP, incluindo usuários, cadeiras, agendamentos, aprovações e configurações de horários.

## Base URL

```
http://localhost:3000
```

## Autenticação

A API usa autenticação JWT Bearer Token. Após fazer login, use o token retornado no header `Authorization: Bearer <token>`.

## Soft Delete Automático

Todos os endpoints de DELETE agora fazem **soft delete** automaticamente:

- Registros não são removidos do banco
- Campo `deletedAt` é preenchido com a data/hora atual
- Queries automáticas filtram registros com `deletedAt = null`

### Campos de Timestamp

Todos os models agora incluem automaticamente:

- `createdAt` - Data/hora de criação (preenchido automaticamente)
- `updatedAt` - Data/hora da última atualização (atualizado automaticamente)
- `deletedAt` - Data/hora de exclusão (null se não deletado)

### Exemplo de Response com Timestamps:

```json
{
  "id": 1,
  "name": "monday",
  "scheduleConfigId": 1,
  "createdAt": "2025-01-20T10:00:00.000Z",
  "updatedAt": "2025-01-20T15:30:00.000Z",
  "deletedAt": null
}
```

---

## Endpoints

### 🔐 Autenticação

#### POST /auth/login

Faz login do usuário e retorna um token JWT.

**Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

### 👥 Usuários

#### GET /users

Lista todos os usuários com paginação opcional.

**Query Parameters (opcionais):**

- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 9, máximo: 50)
- `search` - Buscar por username
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

Cria um novo usuário.

**Body:**

```json
{
  "username": "novo_usuario",
  "password": "senha123",
  "roleId": 2
}
```

#### GET /users/:id

Busca usuário por ID.

#### DELETE /users/:id

Deleta um usuário.

---

### 🪑 Cadeiras

#### GET /chairs

Lista todas as cadeiras com paginação opcional.

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

#### POST /chairs

Cria uma nova cadeira.

**Body:**

```json
{
  "name": "Cadeira 1",
  "description": "Cadeira na sala principal",
  "location": "Sala A"
}
```

#### GET /chairs/:id

Busca cadeira por ID.

#### PATCH /chairs/:id

Atualiza uma cadeira.

**Body:**

```json
{
  "name": "Cadeira 1 Atualizada",
  "status": "MAINTENANCE"
}
```

#### DELETE /chairs/:id

Deleta uma cadeira.

---

### 📅 Agendamentos

#### GET /appointments

Lista todos os agendamentos com paginação opcional.

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

#### GET /appointments/scheduled

Lista agendamentos agendados (apenas para admin).

#### GET /appointments/available-times

Lista horários disponíveis para uma data específica.

**Query Parameters:**

- `date` - Data no formato YYYY-MM-DD (obrigatório)
- `page` - Número da página (opcional)
- `limit` - Itens por página (opcional)

**Exemplo:**

```
GET /appointments/available-times?date=2025-01-20&page=1&limit=3
```

**Response:**

```json
{
  "chairs": [
    {
      "chairId": 1,
      "chairName": "Cadeira 1",
      "chairLocation": "Sala A",
      "available": ["2025-01-20T08:00:00.000Z", "2025-01-20T08:30:00.000Z"],
      "unavailable": ["2025-01-20T09:00:00.000Z"],
      "totalSlots": 16,
      "bookedSlots": 1,
      "availableSlots": 15
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 3,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "lastPage": 3
  },
  "totalSlots": 16,
  "bookedSlots": 5,
  "availableSlots": 75
}
```

#### POST /appointments

Cria um novo agendamento.

**Body:**

```json
{
  "chairId": 1,
  "datetimeStart": "2025-01-20T08:00:00.000Z"
}
```

#### PATCH /appointments/:id/cancel

Cancela um agendamento.

#### PATCH /appointments/:id/confirm

Confirma um agendamento (apenas para admin).

---

### ✅ Aprovações

#### GET /approvals

Lista todas as aprovações com paginação opcional.

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

#### GET /approvals/:id

Busca aprovação por ID.

#### PATCH /approvals/:id

Atualiza status da aprovação.

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

**Exemplo:**

```
GET /days-of-week?page=1&limit=9&search=monday&sortBy=name-asc
```

**Response com paginação:**

```json
{
  "days": [
    {
      "id": 1,
      "name": "monday",
      "scheduleConfigId": 1
    },
    {
      "id": 2,
      "name": "tuesday",
      "scheduleConfigId": 1
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 7,
    "itemsPerPage": 9,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "lastPage": 2
  }
}
```

#### POST /days-of-week

Cria um novo dia da semana.

**Body:**

```json
{
  "name": "saturday"
}
```

#### GET /days-of-week/:id

Busca dia da semana por ID.

#### PATCH /days-of-week/:id

Atualiza um dia da semana.

**Body:**

```json
{
  "name": "saturday"
}
```

#### DELETE /days-of-week/:id

Deleta um dia da semana.

#### DELETE /days-of-week

Deleta múltiplos dias da semana.

**Body:**

```json
{
  "ids": [1, 2, 3]
}
```

---

### ⏰ Configurações de Horário

#### GET /schedules

Retorna a configuração de horário atual (apenas uma configuração global).

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
    },
    {
      "id": 4,
      "name": "thursday"
    },
    {
      "id": 5,
      "name": "friday"
    }
  ]
}
```

#### PATCH /schedules

Atualiza a configuração de horário existente.

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

Remove a configuração de horário existente.

**Response:**

```json
{
  "message": "Configuração removida com sucesso"
}
```

---

### 📊 Dashboard

#### GET /dashboard

Retorna dados do dashboard para o usuário logado.

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
  "lastUpdated": "2025-01-20T10:00:00.000Z"
}
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
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
2. Configure a variável `baseUrl` para `http://localhost:3000`
3. Faça login usando o endpoint `/auth/login`
4. Copie o token retornado e configure a variável `token`
5. Todos os outros endpoints usarão automaticamente o token de autenticação

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

### 2. Listar Cadeiras com Paginação

```bash
GET /chairs?page=1&limit=9&status=ACTIVE&sortBy=newest
```

### 3. Criar um Agendamento

```bash
POST /appointments
{
  "chairId": 1,
  "datetimeStart": "2025-01-20T08:00:00.000Z"
}
```

### 4. Buscar Horários Disponíveis

```bash
GET /appointments/available-times?date=2025-01-20&page=1&limit=3
```

### 5. Aprovar um Usuário

```bash
PATCH /approvals/1
{
  "status": "approved"
}
```

## User Management

### Update User (PATCH)

**Endpoint:** `PATCH /users/:id`

**Description:** Updates a user's information. Users can update their own data, while admins can update any user's data.

**Authentication:** Required (JWT token)

**Authorization:**

- Users can only update their own data
- Admins can update any user's data

**Request Body:** (All fields are optional - only send the fields you want to update)

```json
{
  "username": "new_username",
  "password": "new_password",
  "roleId": 2,
  "fullName": "New Full Name",
  "cpf": "123.456.789-00",
  "jobFunction": "New Job Function",
  "position": "New Position",
  "registration": "NEW123",
  "sector": "New Sector",
  "email": "newemail@example.com",
  "phone": "(11) 99999-9999",
  "gender": "M",
  "birthDate": "1990-01-01"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Usuário atualizado com sucesso",
  "data": {
    "id": 1,
    "username": "new_username",
    "status": "approved",
    "roleId": 2,
    "fullName": "New Full Name",
    "cpf": "123.456.789-00",
    "jobFunction": "New Job Function",
    "position": "New Position",
    "registration": "NEW123",
    "sector": "New Sector",
    "email": "newemail@example.com",
    "phone": "(11) 99999-9999",
    "gender": "M",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (User Not Found - 404):**

```json
{
  "success": false,
  "message": "Usuário não encontrado",
  "error": true
}
```

**Response (Validation Error - 400):**

```json
{
  "success": false,
  "message": "E-mail inválido",
  "error": true
}
```

**Response (Authorization Error - 403):**

```json
{
  "success": false,
  "message": "Acesso negado. Você só pode atualizar seus próprios dados.",
  "error": true
}
```

**Example Usage:**

```bash
# Update user's email and phone
curl -X PATCH http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phone": "(11) 88888-8888"
  }'

# Update user's password
curl -X PATCH http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "new_secure_password"
  }'
```

**Notes:**

- Only send the fields you want to update
- Password will be automatically hashed
- Unique fields (username, email, cpf, registration) will be validated for duplicates
- Date fields should be in ISO format (YYYY-MM-DD)
- Gender must be one of: "M", "F", "Outro"
