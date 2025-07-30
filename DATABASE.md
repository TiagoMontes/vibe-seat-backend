# 🗄️ SEJUSP Backend - Estrutura do Banco de Dados

## Visão Geral

O sistema utiliza **MySQL** como banco de dados principal, gerenciado através do **Prisma ORM**. A arquitetura implementa **soft delete** em todas as entidades, controle de acesso hierárquico e um sistema robusto de agendamentos com aprovação de usuários.

---

## 📊 Diagrama de Relacionamentos

### Entidades e Relacionamentos:

**ROLE** ────(um role pode ter)───→ **MUITOS USERS**
- Um perfil de acesso (admin, attendant, user) pode ser atribuído a vários usuários
- Cada usuário pertence a apenas um role

**USER** ────(um user pode ter)───→ **1 APPOINTMENT ATIVO**
- Regra de negócio: usuário só pode ter 1 agendamento com status SCHEDULED/CONFIRMED
- Historicamente pode ter vários agendamentos (incluindo cancelados/passados)

**APPOINTMENT** ────(um appointment pode ter)───→ **MUITOS EMAIL LOGS**
- Cada agendamento gera vários emails: confirmação, lembrete, etc.
- Rastreamento completo de comunicação por agendamento

**CHAIR** ────(uma chair pode ter)───→ **MUITOS APPOINTMENTS**
- Uma cadeira pode ser agendada várias vezes em horários diferentes
- Cada agendamento usa apenas uma cadeira

**USER** ────(um user pode ter)───→ **MUITAS APROVAÇÕES**
- Usuário pode passar por múltiplos processos de aprovação
- Mudanças de role geram novas aprovações

**SCHEDULE CONFIG** ────(uma config tem)───→ **MUITOS DIAS DA SEMANA**
- Configuração global define quais dias estão disponíveis
- Singleton: apenas uma configuração ativa por vez

---

## 🔧 Configuração do Banco

### Conexão

- Conexão feita pelo docker-compose.yml
- **DATABASE_URL**: `mysql://root:root@db:3306/vibe-seat-db?connection_limit=50`

### Provider

- **Banco**: MySQL
- **ORM**: Prisma
- **Ambiente**: Docker (recomendado)

### Configuração de Timezone

O sistema utiliza configuração centralizada de timezone através de variáveis de ambiente:

```yaml
# docker-compose.yml
environment:
  DATABASE_URL: mysql://root:root@db:3306/vibe-seat-db?connection_limit=50
  TIMEZONE: America/Rio_Branco    # Timezone padrão (UTC-5)
  # ou
  TZ: America/Rio_Branco          # Alternativo
```

**Timezone padrão**: `America/Rio_Branco` (UTC-5)

**Funcionalidades afetadas:**
- ✅ Timestamps de agendamentos (datetimeStart, datetimeEnd)
- ✅ Sistema de emails automáticos
- ✅ Cron jobs para lembretes
- ✅ Logs e auditoria

**⚠️ Importante**: Não use arquivos `.env` locais. Todas as configurações ficam no `docker-compose.yml`.

---

## 📋 Entidades Principais

### 1. **Role** - Perfis de Acesso

```sql
CREATE TABLE Role (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL
);
```

**Propósito**: Define os perfis de acesso do sistema
**Valores padrão**: `admin`, `attendant`, `user`
**Hierarquia**: `user < attendant < admin`

### 2. **User** - Usuários do Sistema

```sql
CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    roleId INT NOT NULL,
    fullName VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    jobFunction VARCHAR(255),
    position VARCHAR(255),
    registration VARCHAR(255) UNIQUE,
    sector VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    gender VARCHAR(10),
    birthDate DATE,
    -- Timestamps
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL,
    FOREIGN KEY (roleId) REFERENCES Role(id)
);
```

**Propósito**: Gerencia usuários com campos completos
**Status**: `pending`, `approved`, `rejected`
**Validações**: CPF, email, username e matrícula únicos

### 3. **UserApproval** - Workflow de Aprovação

```sql
CREATE TABLE UserApproval (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    requestedRoleId INT NOT NULL,
    approvedById INT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (requestedRoleId) REFERENCES Role(id),
    FOREIGN KEY (approvedById) REFERENCES User(id)
);
```

**Propósito**: Controla aprovação hierárquica de usuários
**Regras**:

- Atendentes aprovam usuários
- Administradores aprovam atendentes
- Administradores podem aprovar qualquer role

### 4. **Chair** - Cadeiras de Massagem

```sql
CREATE TABLE Chair (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(255),
    status ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') DEFAULT 'ACTIVE',
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL
);
```

**Propósito**: Gerencia cadeiras de massagem
**Status**:

- `ACTIVE`: Disponível para agendamento
- `MAINTENANCE`: Em manutenção
- `INACTIVE`: Inativa/desabilitada

### 5. **ScheduleConfig** - Configuração Global (Singleton)

```sql
CREATE TABLE ScheduleConfig (
    id INT PRIMARY KEY DEFAULT 1,
    timeRanges JSON NOT NULL,
    validFrom DATETIME,
    validTo DATETIME,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL
);
```

**Propósito**: Configuração global de horários de funcionamento
**Estrutura JSON**:

```json
[
  { "start": "08:00", "end": "10:00" },
  { "start": "14:00", "end": "16:00" },
  { "start": "18:00", "end": "20:00" }
]
```

### 6. **DayOfWeek** - Dias da Semana Disponíveis

```sql
CREATE TABLE DayOfWeek (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    scheduleConfigId INT,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL,
    FOREIGN KEY (scheduleConfigId) REFERENCES ScheduleConfig(id)
);
```

**Propósito**: Define dias da semana disponíveis para agendamento
**Valores**: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

### 7. **Appointment** - Agendamentos

```sql
CREATE TABLE Appointment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    chairId INT NOT NULL,
    datetimeStart DATETIME NOT NULL,
    datetimeEnd DATETIME NOT NULL,
    status ENUM('SCHEDULED', 'CANCELLED', 'CONFIRMED') DEFAULT 'SCHEDULED',
    presenceConfirmed BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (chairId) REFERENCES Chair(id)
);
```

**Propósito**: Gerencia agendamentos de sessões
**Status**:

- `SCHEDULED`: Agendado
- `CANCELLED`: Cancelado
- `CONFIRMED`: Presença confirmada

### 8. **EmailLog** - Log de Emails Automáticos

```sql
CREATE TABLE EmailLog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointmentId INT NOT NULL,
    emailType ENUM('CONFIRMATION', 'REMINDER', 'CREATED') NOT NULL,
    recipientEmail VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
    sentAt DATETIME NULL,
    errorMessage TEXT NULL,
    category VARCHAR(255) NULL,  -- Categoria do Mailtrap
    createdAt DATETIME DEFAULT NOW(),
    updatedAt DATETIME ON UPDATE NOW(),
    deletedAt DATETIME NULL,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(id),
    UNIQUE KEY unique_appointment_email_type (appointmentId, emailType)
);
```

**Propósito**: Rastreia e gerencia envio de emails automáticos relacionados a agendamentos

**Tipos de Email (EmailType)**:
- `CONFIRMATION`: Email de confirmação de agendamento
- `REMINDER`: Email de lembrete enviado antes da sessão
- `CREATED`: Email notificando criação de novo agendamento

**Status de Email (EmailStatus)**:
- `PENDING`: Email pendente para envio
- `SENT`: Email enviado com sucesso
- `FAILED`: Falha no envio do email

**Campos Especiais**:
- `sentAt`: Timestamp de quando o email foi enviado (null se pendente/falhou)
- `errorMessage`: Detalhes do erro em caso de falha no envio
- `category`: Categoria do Mailtrap para organização e análise
- **Unique Constraint**: Previne duplicação do mesmo tipo de email para o mesmo agendamento

---

## 🔗 Relacionamentos Detalhados

### **1:N - Role → User**

- Um role pode ter múltiplos usuários
- Cada usuário pertence a exatamente um role
- Chave estrangeira: `User.roleId → Role.id`

### **1:N - User → Appointment**

- Um usuário pode ter múltiplos agendamentos
- Cada agendamento pertence a um usuário
- Chave estrangeira: `Appointment.userId → User.id`

### **1:N - Chair → Appointment**

- Uma cadeira pode ter múltiplos agendamentos
- Cada agendamento usa uma cadeira
- Chave estrangeira: `Appointment.chairId → Chair.id`

### **1:N - Appointment → EmailLog**

- Um agendamento pode gerar múltiplos logs de email
- Cada log de email pertence a um agendamento
- Chave estrangeira: `EmailLog.appointmentId → Appointment.id`
- **Constraint única**: `(appointmentId, emailType)` - previne duplicatas do mesmo tipo

### **1:N - ScheduleConfig → DayOfWeek**

- Uma configuração pode ter múltiplos dias
- Cada dia pode pertencer a uma configuração (nullable)
- Chave estrangeira: `DayOfWeek.scheduleConfigId → ScheduleConfig.id`

### **Relacionamentos Complexos - UserApproval**

- **User (Solicitante)**: `UserApproval.userId → User.id`
- **Role (Solicitado)**: `UserApproval.requestedRoleId → Role.id`
- **User (Aprovador)**: `UserApproval.approvedById → User.id`

---

## 🛡️ Recursos de Segurança

### **Soft Delete**

Todas as entidades implementam soft delete:

```typescript
deletedAt: DateTime? // null = ativo, data = deletado
```

### **Timestamps Automáticos**

```typescript
createdAt: DateTime @default(now())
updatedAt: DateTime @updatedAt
```

### **Validações de Unicidade**

- `User.username`, `User.cpf`, `User.email`, `User.registration`
- `Role.name`, `Chair.name`

---

## 📊 Índices e Performance

### **Índices Principais**

```sql
-- Índices de chave primária (automáticos)
PRIMARY KEY (id) em todas as tabelas

-- Índices únicos
UNIQUE INDEX idx_user_username ON User(username)
UNIQUE INDEX idx_user_cpf ON User(cpf)
UNIQUE INDEX idx_user_email ON User(email)
UNIQUE INDEX idx_user_registration ON User(registration)
UNIQUE INDEX idx_role_name ON Role(name)
UNIQUE INDEX idx_chair_name ON Chair(name)

-- Índices de chave estrangeira (automáticos no MySQL)
INDEX idx_user_roleId ON User(roleId)
INDEX idx_appointment_userId ON Appointment(userId)
INDEX idx_appointment_chairId ON Appointment(chairId)
INDEX idx_emaillog_appointmentId ON EmailLog(appointmentId)
INDEX idx_userapproval_userId ON UserApproval(userId)
INDEX idx_userapproval_requestedRoleId ON UserApproval(requestedRoleId)
INDEX idx_userapproval_approvedById ON UserApproval(approvedById)
INDEX idx_dayofweek_scheduleConfigId ON DayOfWeek(scheduleConfigId)
```

### **Índices para Soft Delete**

```sql
-- Filtros por registros ativos
INDEX idx_user_deletedAt ON User(deletedAt)
INDEX idx_chair_deletedAt ON Chair(deletedAt)
INDEX idx_appointment_deletedAt ON Appointment(deletedAt)
INDEX idx_emaillog_deletedAt ON EmailLog(deletedAt)
INDEX idx_role_deletedAt ON Role(deletedAt)
INDEX idx_userapproval_deletedAt ON UserApproval(deletedAt)
INDEX idx_scheduleconfig_deletedAt ON ScheduleConfig(deletedAt)
INDEX idx_dayofweek_deletedAt ON DayOfWeek(deletedAt)
```

---

## 🚀 Operações Comuns

### **Buscar Usuários Ativos**

```sql
SELECT * FROM User
WHERE deletedAt IS NULL
AND status = 'approved';
```

### **Agendamentos por Timezone**

```sql
-- Agendamentos de hoje (considerando timezone da aplicação)
SELECT a.*, u.fullName, c.name as chairName,
       CONVERT_TZ(a.datetimeStart, 'UTC', 'America/Rio_Branco') as localStart,
       CONVERT_TZ(a.datetimeEnd, 'UTC', 'America/Rio_Branco') as localEnd
FROM Appointment a
JOIN User u ON a.userId = u.id
JOIN Chair c ON a.chairId = c.id
WHERE DATE(CONVERT_TZ(a.datetimeStart, 'UTC', 'America/Rio_Branco')) = CURDATE()
AND a.deletedAt IS NULL;
```

### **Agendamentos de Hoje**

```sql
SELECT a.*, u.fullName, c.name as chairName
FROM Appointment a
JOIN User u ON a.userId = u.id
JOIN Chair c ON a.chairId = c.id
WHERE DATE(a.datetimeStart) = CURDATE()
AND a.deletedAt IS NULL;
```

### **Aprovações Pendentes**

```sql
SELECT ua.*, u.fullName, r.name as requestedRole
FROM UserApproval ua
JOIN User u ON ua.userId = u.id
JOIN Role r ON ua.requestedRoleId = r.id
WHERE ua.status = 'pending'
AND ua.deletedAt IS NULL;
```

### **Horários Disponíveis**

```sql
-- Slots ocupados para uma data
SELECT datetimeStart, datetimeEnd
FROM Appointment
WHERE chairId = ?
AND DATE(datetimeStart) = ?
AND status IN ('SCHEDULED', 'CONFIRMED')
AND deletedAt IS NULL;
```

### **Logs de Email por Agendamento**

```sql
-- Histórico completo de emails de um agendamento
SELECT el.*, a.datetimeStart, u.fullName, u.email
FROM EmailLog el
JOIN Appointment a ON el.appointmentId = a.id
JOIN User u ON a.userId = u.id
WHERE el.appointmentId = ?
AND el.deletedAt IS NULL
ORDER BY el.createdAt DESC;

-- Emails pendentes para envio
SELECT el.*, a.datetimeStart, u.email as recipientEmail
FROM EmailLog el
JOIN Appointment a ON el.appointmentId = a.id  
JOIN User u ON a.userId = u.id
WHERE el.status = 'PENDING'
AND el.deletedAt IS NULL
ORDER BY el.createdAt ASC;
```

---

## 📝 Migrations e Versionamento

### **Comandos Principais**

```bash
# Gerar nova migration
bunx prisma migrate dev --name nome-da-migration

# Aplicar migrations
bunx prisma migrate deploy

# Reset do banco (desenvolvimento)
bunx prisma migrate reset

# Gerar cliente Prisma
bunx prisma generate

# Comandos no Docker (recomendado)
docker exec backend-app-1 bun run prisma:migrate
docker exec backend-app-1 bun run prisma:generate
```

### **Estrutura de Migrations**

```
prisma/migrations/
├── 20250120_init/
├── 20250121_add_fields/
├── 20250122_add_soft_delete/
└── migration_lock.toml
```

---

## 🔍 Monitoramento e Manutenção

### **Queries de Monitoramento**

```sql
-- Estatísticas gerais
SELECT
  (SELECT COUNT(*) FROM User WHERE deletedAt IS NULL) as active_users,
  (SELECT COUNT(*) FROM Chair WHERE deletedAt IS NULL AND status = 'ACTIVE') as active_chairs,
  (SELECT COUNT(*) FROM Appointment WHERE deletedAt IS NULL AND status = 'SCHEDULED') as scheduled_appointments,
  (SELECT COUNT(*) FROM UserApproval WHERE deletedAt IS NULL AND status = 'pending') as pending_approvals;

-- Limpeza de registros antigos (soft deleted há mais de 1 ano)
SELECT COUNT(*) FROM User
WHERE deletedAt IS NOT NULL
AND deletedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### **Backup e Restore**

```bash
# Backup
mysqldump -u root -p sejusp-db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mysql -u root -p sejusp-db < backup_file.sql
```

---

## 📈 Escalabilidade e Performance

### **Otimizações Implementadas**

1. **Connection Pooling**: `connection_limit=50`
2. **Soft Delete**: Mantém integridade referencial
3. **Índices Estratégicos**: Em campos de busca frequente
4. **Singleton Pattern**: ScheduleConfig com ID fixo = 1

### **Recomendações Futuras**

1. **Particionamento**: Tabela de Appointments por data
2. **Arquivamento**: Agendamentos antigos
3. **Cache**: Redis para configurações frequentes
4. **Read Replicas**: Para consultas de relatórios
