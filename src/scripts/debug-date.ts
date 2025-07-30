import { timezoneUtils } from '@/config/timezone';
import { prisma } from '@/lib/prisma';

async function debugDateComparison() {
  console.log('🔍 Debug da comparação de datas\n');

  // 1. Buscar configuração de agenda
  const scheduleConfig = await prisma.scheduleConfig.findFirst({
    include: {
      days: true,
    },
  });

  if (!scheduleConfig) {
    console.log('❌ Nenhuma configuração encontrada');
    return;
  }

  console.log('📅 Configuração de agenda:');
  console.log(`  - validFrom: ${scheduleConfig.validFrom}`);
  console.log(`  - validTo: ${scheduleConfig.validTo}`);
  console.log(`  - timeRanges: ${JSON.stringify(scheduleConfig.timeRanges)}`);
  console.log('');

  // 2. Testar data atual
  const testDate = '2025-07-30';
  // Criar data diretamente no timezone local sem conversão UTC
  const dateParts = testDate.split('-');
  const year = parseInt(dateParts[0]!);
  const month = parseInt(dateParts[1]!) - 1; // month é 0-indexed
  const day = parseInt(dateParts[2]!);
  const targetDate = new Date(year, month, day);
  
  console.log('🕐 Comparação de datas:');
  console.log(`  - Date string enviada: ${testDate}`);
  console.log(`  - new Date(testDate): ${new Date(testDate)}`);
  console.log(`  - targetDate (timezone local): ${targetDate}`);
  console.log(`  - scheduleConfig.validFrom: ${scheduleConfig.validFrom}`);
  console.log('');

  console.log('✅ Validações:');
  console.log(`  - targetDate < validFrom: ${targetDate < (scheduleConfig.validFrom || new Date(0))}`);
  console.log(`  - targetDate > validTo: ${targetDate > (scheduleConfig.validTo || new Date('2099-12-31'))}`);
  console.log('');

  // 3. Verificar dia da semana
  const dayNames = [
    'Domingo',
    'Segunda-feira', 
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const currentDayName = dayNames[targetDate.getDay()];
  
  console.log('📆 Dia da semana:');
  console.log(`  - targetDate.getDay(): ${targetDate.getDay()}`);
  console.log(`  - currentDayName: ${currentDayName}`);
  console.log('');

  const dayConfig = scheduleConfig.days.find(day => day.name === currentDayName);
  console.log('🗓️ Configuração do dia:');
  console.log(`  - dayConfig encontrado: ${dayConfig ? 'Sim' : 'Não'}`);
  if (dayConfig) {
    console.log(`  - dayConfig.id: ${dayConfig.id}`);
    console.log(`  - dayConfig.name: ${dayConfig.name}`);
  }
  console.log('');

  // 4. Informações do timezone
  const timezoneInfo = timezoneUtils.getTimezoneInfo();
  console.log('🌍 Timezone info:');
  console.log(`  - timezone: ${timezoneInfo.timezone}`);
  console.log(`  - currentTime: ${timezoneInfo.currentTime}`);
  console.log(`  - offsetHours: ${timezoneInfo.offsetHours}`);
  console.log(`  - description: ${timezoneInfo.description}`);

  await prisma.$disconnect();
}

debugDateComparison();