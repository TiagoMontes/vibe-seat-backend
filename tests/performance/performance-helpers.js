const faker = require('faker');

// Configure faker para português brasileiro
faker.locale = 'pt_BR';

// Contador global para garantir dados únicos
let userCounter = 0;
let attendantCounter = 0;

// Função para gerar CPF válido (básico)
function generateCPF() {
  const randomNum = () => Math.floor(Math.random() * 9);
  const cpf = Array.from({ length: 9 }, randomNum);

  // Calcular dígitos verificadores (simplificado)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpf[i] * (10 - i);
  }
  cpf.push(11 - (sum % 11) > 9 ? 0 : 11 - (sum % 11));

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpf[i] * (11 - i);
  }
  cpf.push(11 - (sum % 11) > 9 ? 0 : 11 - (sum % 11));

  return cpf.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para gerar telefone brasileiro
function generatePhone() {
  const ddd = Math.floor(Math.random() * 89) + 11; // 11-99
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `(${ddd}) 9${number.toString().substring(0, 4)}-${number.toString().substring(4, 8)}`;
}

// Gerar dados de usuário comum
function generateUserData(requestParams, context, ee, next) {
  userCounter++;

  const sectors = [
    'Recursos Humanos',
    'Tecnologia da Informação',
    'Administração',
    'Segurança Pública',
    'Educação',
    'Saúde',
    'Finanças',
    'Operações',
  ];

  const jobFunctions = [
    'Analista',
    'Assistente',
    'Coordenador',
    'Técnico',
    'Especialista',
    'Consultor',
    'Supervisor',
    'Auxiliar',
  ];

  const positions = [
    'Analista de Sistemas',
    'Assistente Administrativo',
    'Coordenador de RH',
    'Técnico em Segurança',
    'Especialista em TI',
    'Consultor Jurídico',
    'Supervisor de Operações',
    'Auxiliar de Escritório',
  ];

  const genders = ['M', 'F', 'Outro'];

  // Gerar dados únicos
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);

  context.vars.username = `user${userCounter}_${randomId}`;
  context.vars.password = 'senha123';
  context.vars.fullName = faker.name.findName();
  context.vars.cpf = generateCPF();
  context.vars.jobFunction =
    jobFunctions[Math.floor(Math.random() * jobFunctions.length)];
  context.vars.position =
    positions[Math.floor(Math.random() * positions.length)];
  context.vars.registration = `REG${userCounter.toString().padStart(6, '0')}`;
  context.vars.sector = sectors[Math.floor(Math.random() * sectors.length)];
  context.vars.email = `user${userCounter}.${randomId}@sejusp.com`;
  context.vars.phone = generatePhone();
  context.vars.gender = genders[Math.floor(Math.random() * genders.length)];

  // Gerar data de nascimento entre 1970 e 2000
  const birthYear = 1970 + Math.floor(Math.random() * 30);
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  context.vars.birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

  return next();
}

// Gerar dados de atendente
function generateAttendantData(requestParams, context, ee, next) {
  attendantCounter++;

  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);

  context.vars.username = `attendant${attendantCounter}_${randomId}`;
  context.vars.password = 'senha123';
  context.vars.fullName = faker.name.findName();
  context.vars.cpf = generateCPF();
  context.vars.registration = `ATD${attendantCounter.toString().padStart(6, '0')}`;
  context.vars.email = `attendant${attendantCounter}.${randomId}@sejusp.com`;
  context.vars.phone = generatePhone();

  return next();
}

// Gerar data disponível para agendamento (próximos 7 dias)
function generateAvailableDate(requestParams, context, ee, next) {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);

  const year = futureDate.getFullYear();
  const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
  const day = futureDate.getDate().toString().padStart(2, '0');

  context.vars.availableDate = `${year}-${month}-${day}`;

  return next();
}

// Função para log de debug
function logContext(requestParams, context, ee, next) {
  console.log('Context variables:', {
    username: context.vars.username,
    email: context.vars.email,
    userId: context.vars.userId,
    token: context.vars.userToken ? 'PRESENT' : 'MISSING',
  });
  return next();
}

// Função para simular tempo de aprovação realístico
function simulateApprovalTime(requestParams, context, ee, next) {
  // Simular que alguns usuários são aprovados mais rapidamente
  const approvalSpeed = Math.random();

  if (approvalSpeed < 0.3) {
    // 30% são aprovados rapidamente (1-3 segundos)
    context.vars.approvalWaitTime = Math.floor(Math.random() * 3) + 1;
  } else if (approvalSpeed < 0.7) {
    // 40% têm aprovação média (5-10 segundos)
    context.vars.approvalWaitTime = Math.floor(Math.random() * 6) + 5;
  } else {
    // 30% têm aprovação lenta (15-30 segundos)
    context.vars.approvalWaitTime = Math.floor(Math.random() * 16) + 15;
  }

  return next();
}

module.exports = {
  generateUserData,
  generateAttendantData,
  generateAvailableDate,
  logContext,
  simulateApprovalTime,
};
