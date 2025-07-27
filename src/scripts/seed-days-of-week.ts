import { prisma } from '@/lib/prisma';

const daysOfWeek = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export async function seedDaysOfWeek() {
  try {
    // Verificar quantos dias da semana já existem
    const existingDays = await prisma.dayOfWeek.count();

    if (existingDays === 7) {
      console.log('✅ Dias da semana já estão completos (7 dias encontrados)');
      return;
    }

    if (existingDays > 0) {
      console.log(
        `⚠️ Encontrados ${existingDays} dias existentes. Verificando quais faltam...`
      );

      // Buscar dias existentes
      const existingDayNames = await prisma.dayOfWeek.findMany({
        select: { name: true },
      });
      const existingNames = existingDayNames.map(day => day.name);

      // Criar apenas os dias que não existem
      for (const dayName of daysOfWeek) {
        if (!existingNames.includes(dayName)) {
          await prisma.dayOfWeek.create({
            data: { name: dayName },
          });
          console.log(`✅ Criado dia da semana: ${dayName}`);
        }
      }
    } else {
      console.log('📅 Criando dias da semana...');

      // Criar todos os dias da semana
      for (const dayName of daysOfWeek) {
        await prisma.dayOfWeek.create({
          data: { name: dayName },
        });
        console.log(`✅ Criado dia da semana: ${dayName}`);
      }
    }

    // Verificar resultado final
    const finalCount = await prisma.dayOfWeek.count();
    console.log(
      `✅ Seed de dias da semana concluído. Total: ${finalCount} dias`
    );
  } catch (error) {
    console.error('❌ Erro ao criar dias da semana:', error);
    throw error;
  }
}

// Permitir execução direta do script
if (import.meta.main) {
  seedDaysOfWeek().finally(() => prisma.$disconnect());
}
